#!/usr/bin/env node
'use strict';

/**
 * Bakes ../../skills/*.md into skills-data.js, a plain ES module worker.js
 * imports. Cloudflare Workers have no filesystem access at request time
 * (unlike server.js's stdio version, which reads skills/*.md fresh via fs
 * on every call) — so the content has to be embedded in the deployed
 * bundle instead, generated once here rather than fetched per-request.
 *
 * Run before every deploy: node build.js && npx wrangler deploy
 * (from this directory, mcp-server/remote/)
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');
const OUT_FILE = path.join(__dirname, 'skills-data.js');

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return {};
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return meta;
}

const files = fs.readdirSync(SKILLS_DIR).filter((f) => f.endsWith('.md'));
const skills = files.map((file) => {
  const raw = fs.readFileSync(path.join(SKILLS_DIR, file), 'utf8');
  const meta = parseFrontmatter(raw);
  const id = meta.name || path.basename(file, '.md');
  return { id, description: meta.description || '', content: raw };
});

const header =
  '// GENERATED FILE — do not edit by hand.\n' +
  '// Run `node build.js` (from mcp-server/remote/) to regenerate from ../../skills/*.md.\n' +
  `// Last generated: ${new Date().toISOString().slice(0, 10)}\n\n`;

fs.writeFileSync(OUT_FILE, header + `export const SKILLS = ${JSON.stringify(skills, null, 2)};\n`);

console.log(`Wrote ${skills.length} skills to ${path.relative(process.cwd(), OUT_FILE)}`);
