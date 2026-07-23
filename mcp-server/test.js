#!/usr/bin/env node
'use strict';

/**
 * Smoke test for server.js — spawns it as a real subprocess and drives it
 * over stdio exactly as an MCP client would (initialize -> initialized ->
 * tools/list -> tools/call), with no SDK on either side. This is the closest
 * verification available in a sandbox with no network access to actually
 * connect a second, separate agent session — see AIPB-11's Delivery Note.
 *
 * Run: node mcp-server/test.js
 */

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const assert = require('assert');

const serverPath = path.join(__dirname, 'server.js');
const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'inherit'] });

const rl = readline.createInterface({ input: child.stdout, terminal: false });
let nextId = 1;
const pending = new Map();

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  const msg = JSON.parse(trimmed);
  if (msg.id !== undefined && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});

function request(method, params) {
  const id = nextId++;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}

function notify(method, params) {
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
}

async function main() {
  const init = await request('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'smoke-test', version: '0.0.0' },
  });
  assert.ok(init.result, 'initialize should return a result');
  assert.strictEqual(init.result.serverInfo.name, 'ai-delivery-playbook');
  notify('notifications/initialized', {});

  const list = await request('tools/list', {});
  const toolNames = list.result.tools.map((t) => t.name).sort();
  assert.deepStrictEqual(toolNames, ['get_skill', 'search_skills']);

  const search = await request('tools/call', { name: 'search_skills', arguments: { query: 'commit message' } });
  const searchText = search.result.content[0].text;
  assert.ok(searchText.includes('commit'), `expected "commit" skill in search results, got: ${searchText}`);
  assert.ok(!search.result.isError);

  const getCommit = await request('tools/call', { name: 'get_skill', arguments: { skill_id: 'commit' } });
  const commitText = getCommit.result.content[0].text;
  assert.ok(commitText.includes('name: commit'), 'get_skill(commit) should return the raw skill file with frontmatter');
  assert.ok(commitText.includes('/commit'), 'get_skill(commit) should return the actual skill body');

  const missingArg = await request('tools/call', { name: 'get_skill', arguments: {} });
  assert.strictEqual(missingArg.result.isError, true, 'missing skill_id should be reported as a tool error');

  const missingSkill = await request('tools/call', { name: 'get_skill', arguments: { skill_id: 'does-not-exist' } });
  assert.strictEqual(missingSkill.result.isError, true, 'unknown skill_id should be reported as a tool error');
  assert.ok(missingSkill.result.content[0].text.includes('does-not-exist'));

  const listAll = await request('tools/call', { name: 'search_skills', arguments: { query: '' } });
  const allText = listAll.result.content[0].text;
  const skillCount = (allText.match(/^- \*\*/gm) || []).length;
  assert.ok(skillCount >= 13, `expected at least 13 skills listed, got ${skillCount}`);

  const unknownTool = await request('tools/call', { name: 'not_a_real_tool', arguments: {} });
  assert.strictEqual(unknownTool.result.isError, true);

  console.log(`OK — ${skillCount} skills served; search, fetch, and error paths all verified over real stdio JSON-RPC.`);
  child.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error('FAILED:', err);
  child.kill();
  process.exit(1);
});
