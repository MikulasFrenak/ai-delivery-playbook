#!/usr/bin/env node
// The playbook's own docs check, run on every PR (docs/ci.md): skill frontmatter, skill registration, relative links.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const problems = [];
const read = (path) => readFileSync(join(ROOT, path), "utf-8");

// Skills: CONTRIBUTING.md → "Adding a new skill" (frontmatter) and "Register it in three places".
const agents = read("AGENTS.md");
const architecture = read("architecture.md").split("\n").map((line) => line.trim());
for (const file of readdirSync(join(ROOT, "skills")).filter((f) => f.endsWith(".md"))) {
  const name = file.replace(/\.md$/, "");
  const path = `skills/${file}`;
  const front = read(path).match(/^---\n([\s\S]*?)\n---\n/);
  if (!front) {
    problems.push(`${path}: no frontmatter`);
    continue;
  }
  const field = (key) => front[1].match(new RegExp(`^${key}:\\s*(.*)$`, "m"))?.[1].trim();
  if (field("name") !== name) problems.push(`${path}: \`name:\` should be \`${name}\``);
  if (field("disable-model-invocation") !== "true") problems.push(`${path}: needs \`disable-model-invocation: true\``);
  const description = field("description") ?? "";
  if (!description.includes("NEVER auto-invoke") || !description.includes(`/${name}`)) {
    problems.push(`${path}: the description must end "NEVER auto-invoke — only run when user explicitly types /${name}."`);
  }
  if (!agents.includes(`[\`/${name}\`](./skills/${name}.md)`)) problems.push(`${path}: missing from AGENTS.md's "Skills in this playbook" table`);
  if (!architecture.includes(name)) problems.push(`${path}: missing from architecture.md's Level 1 list`);
}

// Relative links resolve. Code blocks and inline code are skipped: templates show links that aren't meant to resolve.
// Two kinds of link are allowed to point nowhere, on purpose:
const INTENTIONAL = [
  { file: "AGENTS.md", target: /^\.\.\/(apps|packages)\// }, // the Package Map template's placeholder paths
  { file: /^examples\//, target: /(^|\/)\.tasks\// }, // examples keep the paths of their time (tasks/README.md)
];
const markdownFiles = (dir) =>
  readdirSync(join(ROOT, dir)).flatMap((entry) => {
    const path = dir ? `${dir}/${entry}` : entry;
    if (entry.startsWith(".") || entry === "node_modules") return [];
    if (statSync(join(ROOT, path)).isDirectory()) return markdownFiles(path);
    return entry.endsWith(".md") ? [path] : [];
  });
for (const path of markdownFiles("")) {
  const text = read(path).replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target) || target.includes("<")) continue;
    const file = decodeURIComponent(target.split("#")[0]);
    if (!file || existsSync(resolve(ROOT, dirname(path), file))) continue;
    const allowed = INTENTIONAL.some((rule) => (typeof rule.file === "string" ? rule.file === path : rule.file.test(path)) && rule.target.test(file));
    if (!allowed) problems.push(`${path}: link to \`${target}\` points nowhere`);
  }
}

if (problems.length) {
  console.error(`${problems.length} problem(s):\n${problems.map((p) => `- ${p}`).join("\n")}`);
  process.exit(1);
}
console.log("OK — every skill's frontmatter and registration, and every relative link, check out.");
