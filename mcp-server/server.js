#!/usr/bin/env node
'use strict';

/**
 * ai-delivery-playbook skill server — a minimal MCP server, no SDK dependency.
 *
 * Serves this repo's skills/*.md files over the Model Context Protocol so any
 * MCP-compatible agent can pull them at runtime instead of a human copying
 * files into a project's .claude/skills/. See AIPB-11 (.tasks/AIPB-11.md) for
 * why this shape (two generic tools, content served as-is) was chosen over
 * wrapping each skill as its own bespoke tool.
 *
 * Zero npm dependencies on purpose — this repo has no package.json today, and
 * pulling one in for two small stdio tools isn't worth the install step for
 * every user who just wants to run `node mcp-server/server.js`.
 *
 * Wire protocol: JSON-RPC 2.0 over stdio, newline-delimited (per the MCP
 * stdio transport spec — https://modelcontextprotocol.io).
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return {};
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    meta[key] = value;
  }
  return meta;
}

function loadSkills() {
  const files = fs.readdirSync(SKILLS_DIR).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(SKILLS_DIR, file), 'utf8');
    const meta = parseFrontmatter(raw);
    const id = meta.name || path.basename(file, '.md');
    return { id, file, description: meta.description || '' };
  });
}

function searchSkills(query) {
  const skills = loadSkills();
  const q = (query || '').trim().toLowerCase();
  if (!q) return skills;
  const terms = q.split(/\s+/).filter(Boolean);
  return skills
    .map((skill) => {
      const haystack = `${skill.id} ${skill.description}`.toLowerCase();
      const score = terms.reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0);
      return { skill, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.skill);
}

function getSkill(skillId) {
  const match = loadSkills().find((s) => s.id === skillId);
  if (!match) return null;
  return fs.readFileSync(path.join(SKILLS_DIR, match.file), 'utf8');
}

// -- MCP tool definitions --

const TOOLS = [
  {
    name: 'search_skills',
    description:
      'Search this playbook\'s skills by keyword (matches against skill id and description). ' +
      'Call with an empty query to list every skill in the repo.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Free-text search terms, e.g. "commit conventions" or "figma design tokens". Empty string lists all skills.',
        },
      },
    },
  },
  {
    name: 'get_skill',
    description:
      'Fetch the full markdown content (frontmatter included) of one skill by its id, e.g. "commit" or "design-brief". ' +
      'Run search_skills first if you don\'t already know the exact id.',
    inputSchema: {
      type: 'object',
      properties: {
        skill_id: {
          type: 'string',
          description: 'The skill id — matches the "name" field in that skill\'s frontmatter (e.g. "implement-task").',
        },
      },
      required: ['skill_id'],
    },
  },
];

function textResult(text, isError) {
  const result = { content: [{ type: 'text', text }] };
  if (isError) result.isError = true;
  return result;
}

function callTool(name, args) {
  if (name === 'search_skills') {
    const results = searchSkills(args && args.query);
    if (results.length === 0) {
      return textResult('No skills matched that query. Call search_skills with an empty query to list every skill.');
    }
    return textResult(results.map((r) => `- **${r.id}** — ${r.description}`).join('\n'));
  }

  if (name === 'get_skill') {
    const skillId = args && args.skill_id;
    if (!skillId) return textResult('skill_id is required.', true);
    const content = getSkill(skillId);
    if (content === null) {
      const available = loadSkills().map((s) => s.id).join(', ');
      return textResult(`No skill named "${skillId}". Available skills: ${available}`, true);
    }
    return textResult(content);
  }

  return textResult(`Unknown tool: ${name}`, true);
}

// -- JSON-RPC 2.0 over stdio --

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch (err) {
    return; // malformed line — ignore rather than crash the process
  }

  const { id, method, params } = msg;

  switch (method) {
    case 'initialize':
      send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2025-06-18',
          capabilities: { tools: {} },
          serverInfo: { name: 'ai-delivery-playbook', version: '0.1.0' },
        },
      });
      return;

    case 'notifications/initialized':
      return; // notification — no response expected

    case 'tools/list':
      send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
      return;

    case 'tools/call': {
      const { name, arguments: args } = params || {};
      try {
        send({ jsonrpc: '2.0', id, result: callTool(name, args) });
      } catch (err) {
        send({ jsonrpc: '2.0', id, error: { code: -32000, message: err.message } });
      }
      return;
    }

    default:
      if (id !== undefined) {
        send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
      }
  }
});
