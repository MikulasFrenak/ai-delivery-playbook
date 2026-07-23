#!/usr/bin/env node
'use strict';

/**
 * Smoke test for worker.js — imports the *actual* exported `fetch` handler
 * and drives it with real Web-standard Request objects. Node 18+ has
 * fetch/Request/Response as globals (undici-backed), the same Web Fetch
 * API surface Cloudflare Workers implement — so this calls the identical
 * code path Cloudflare would invoke at runtime, without needing wrangler,
 * npm, or network access to test it (all unavailable in the sandbox this
 * was built in — see AIPB-12).
 *
 * Requires skills-data.js to exist — run `node build.js` first.
 * Run: node build.js && node test.js
 */

const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

async function main() {
  const worker = await import(pathToFileURL(path.join(__dirname, 'worker.js')).href);

  async function post(body) {
    const request = new Request('https://example.com/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return worker.default.fetch(request);
  }

  // initialize
  const initRes = await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
  assert.strictEqual(initRes.status, 200);
  const initBody = await initRes.json();
  assert.strictEqual(initBody.result.serverInfo.name, 'ai-delivery-playbook');
  assert.ok(initRes.headers.get('Access-Control-Allow-Origin'));

  // tools/list
  const listRes = await post({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const listBody = await listRes.json();
  const toolNames = listBody.result.tools.map((t) => t.name).sort();
  assert.deepStrictEqual(toolNames, ['get_skill', 'search_skills']);

  // search_skills happy path
  const searchRes = await post({
    jsonrpc: '2.0', id: 3, method: 'tools/call',
    params: { name: 'search_skills', arguments: { query: 'commit message' } },
  });
  const searchBody = await searchRes.json();
  assert.ok(searchBody.result.content[0].text.includes('commit'), 'expected "commit" in search results');
  assert.ok(!searchBody.result.isError);

  // get_skill happy path
  const getRes = await post({
    jsonrpc: '2.0', id: 4, method: 'tools/call',
    params: { name: 'get_skill', arguments: { skill_id: 'commit' } },
  });
  const getBody = await getRes.json();
  assert.ok(getBody.result.content[0].text.includes('name: commit'), 'expected raw frontmatter in get_skill result');

  // list-all (empty query)
  const listAllRes = await post({
    jsonrpc: '2.0', id: 5, method: 'tools/call',
    params: { name: 'search_skills', arguments: { query: '' } },
  });
  const listAllBody = await listAllRes.json();
  const skillCount = (listAllBody.result.content[0].text.match(/^- \*\*/gm) || []).length;
  assert.ok(skillCount >= 13, `expected at least 13 skills, got ${skillCount}`);

  // error paths
  const missingArgRes = await post({
    jsonrpc: '2.0', id: 6, method: 'tools/call',
    params: { name: 'get_skill', arguments: {} },
  });
  assert.strictEqual((await missingArgRes.json()).result.isError, true);

  const missingSkillRes = await post({
    jsonrpc: '2.0', id: 7, method: 'tools/call',
    params: { name: 'get_skill', arguments: { skill_id: 'does-not-exist' } },
  });
  assert.strictEqual((await missingSkillRes.json()).result.isError, true);

  const unknownToolRes = await post({
    jsonrpc: '2.0', id: 8, method: 'tools/call',
    params: { name: 'not_a_real_tool', arguments: {} },
  });
  assert.strictEqual((await unknownToolRes.json()).result.isError, true);

  // notification (no id) — should return 202 with no body
  const notifyRes = await post({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
  assert.strictEqual(notifyRes.status, 202);

  // CORS preflight
  const optionsRes = await worker.default.fetch(new Request('https://example.com/mcp', { method: 'OPTIONS' }));
  assert.strictEqual(optionsRes.status, 204);
  assert.ok(optionsRes.headers.get('Access-Control-Allow-Origin'));

  // GET declined (no SSE support)
  const getMethodRes = await worker.default.fetch(new Request('https://example.com/mcp', { method: 'GET' }));
  assert.strictEqual(getMethodRes.status, 405);

  // wrong path
  const notFoundRes = await worker.default.fetch(new Request('https://example.com/other'));
  assert.strictEqual(notFoundRes.status, 404);

  // malformed JSON body
  const badJsonRes = await worker.default.fetch(
    new Request('https://example.com/mcp', { method: 'POST', body: '{not json' }),
  );
  assert.strictEqual(badJsonRes.status, 400);

  console.log(`OK — ${skillCount} skills served over real Streamable HTTP fetch(), all happy + error paths verified, no wrangler needed.`);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exitCode = 1;
});
