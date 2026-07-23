/**
 * ai-delivery-playbook skill server — remote (Cloudflare Workers) transport.
 *
 * Same two tools as ../server.js (search_skills, get_skill), same skill
 * content, different transport: MCP Streamable HTTP over a single POST
 * /mcp endpoint instead of stdio. No SSE / server-initiated push, no
 * session state — both tools are fully stateless per request, so the
 * simple synchronous-JSON-response mode the Streamable HTTP spec allows
 * is all this needs.
 *
 * Zero npm dependencies, on purpose — same reasoning as server.js (see its
 * header comment): this was built somewhere with no npm registry access,
 * and staying dependency-free means that's a non-issue for deployment too
 * (no `npm install` step, `wrangler deploy` just ships this one file plus
 * the generated skills-data.js).
 *
 * Deliberately NOT sharing tool logic with ../server.js as a common module:
 * that file is CommonJS (Node, reads skills/*.md via fs at request time),
 * this one is an ES module (Workers, reads a build-time-baked array,
 * fs isn't available). Bridging the two module systems isn't something
 * that could be verified in the sandbox this was built in (no npm access
 * to actually run `wrangler dev`/bundle and check the interop works) — so
 * the ~40 lines of tool logic below are intentionally duplicated rather
 * than risk a cross-module shared file nobody could test. See AIPB-12.
 *
 * Skill content comes from ./skills-data.js — run `node build.js` (from
 * this directory) to regenerate it from ../../skills/*.md before deploying.
 */

import { SKILLS } from './skills-data.js';

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

function searchSkills(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return SKILLS;
  const terms = q.split(/\s+/).filter(Boolean);
  return SKILLS
    .map((skill) => {
      const haystack = `${skill.id} ${skill.description}`.toLowerCase();
      const score = terms.reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0);
      return { skill, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.skill);
}

function getSkillContent(skillId) {
  const match = SKILLS.find((s) => s.id === skillId);
  return match ? match.content : null;
}

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
    const content = getSkillContent(skillId);
    if (content === null) {
      const available = SKILLS.map((s) => s.id).join(', ');
      return textResult(`No skill named "${skillId}". Available skills: ${available}`, true);
    }
    return textResult(content);
  }

  return textResult(`Unknown tool: ${name}`, true);
}

function handleRpc(msg) {
  const { id, method, params } = msg || {};

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2025-06-18',
          capabilities: { tools: {} },
          serverInfo: { name: 'ai-delivery-playbook', version: '0.1.0' },
        },
      };

    case 'notifications/initialized':
      return null; // notification — no response

    case 'tools/list':
      return { jsonrpc: '2.0', id, result: { tools: TOOLS } };

    case 'tools/call': {
      const { name, arguments: args } = params || {};
      try {
        return { jsonrpc: '2.0', id, result: callTool(name, args) };
      } catch (err) {
        return { jsonrpc: '2.0', id, error: { code: -32000, message: err.message } };
      }
    }

    default:
      return id !== undefined
        ? { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } }
        : null;
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname !== '/mcp') {
      return new Response("Not found. This server's MCP endpoint is POST /mcp.", {
        status: 404,
        headers: CORS_HEADERS,
      });
    }

    if (request.method === 'GET') {
      // Optional SSE stream for server-initiated messages. Neither tool
      // needs server push (both are one-shot request/response), so this
      // declines explicitly per spec rather than silently doing nothing.
      return new Response('This server does not support server-initiated streams. Use POST /mcp.', {
        status: 405,
        headers: { ...CORS_HEADERS, Allow: 'POST, OPTIONS' },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed.', {
        status: 405,
        headers: { ...CORS_HEADERS, Allow: 'POST, OPTIONS' },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return Response.json(
        { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const messages = Array.isArray(body) ? body : [body];
    const responses = messages.map(handleRpc).filter((r) => r !== null);

    if (responses.length === 0) {
      // Every message was a notification — nothing to return.
      return new Response(null, { status: 202, headers: CORS_HEADERS });
    }

    const payload = Array.isArray(body) ? responses : responses[0];
    return Response.json(payload, { headers: CORS_HEADERS });
  },
};
