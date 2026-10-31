// Runs check-docs.mjs on a scratch copy of the repo: clean it passes, and each planted mistake is reported.
import { test } from "node:test";
import assert from "node:assert/strict";
import { appendFileSync, cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function scratchCopy() {
  const dir = mkdtempSync(join(tmpdir(), "check-docs-"));
  cpSync(ROOT, dir, { recursive: true, filter: (path) => !/\/(\.git|node_modules)(\/|$)/.test(path) });
  return dir;
}
const run = (dir) => spawnSync(process.execPath, [join(dir, ".github/scripts/check-docs.mjs")], { encoding: "utf-8" });

test("passes on the repo as it is", () => {
  const result = run(ROOT);
  assert.equal(result.status, 0, result.stderr);
});

test("reports bad frontmatter, a missing registration and a dead link, each by file", () => {
  const dir = scratchCopy();
  try {
    const skill = join(dir, "skills/diagram.md");
    writeFileSync(skill, readFileSync(skill, "utf-8").replace("disable-model-invocation: true", "disable-model-invocation: false"));
    const architecture = join(dir, "architecture.md");
    writeFileSync(architecture, readFileSync(architecture, "utf-8").replace(/^branch-cleanup\n/m, ""));
    writeFileSync(join(dir, "skills/new-skill.md"), "---\nname: wrong-name\ndisable-model-invocation: true\ndescription: x\n---\n");
    appendFileSync(join(dir, "CONTRIBUTING.md"), "\nSee [the guide](./docs/no-such-file.md).\n");

    const result = run(dir);
    assert.equal(result.status, 1);
    for (const expected of [
      "skills/diagram.md: needs `disable-model-invocation: true`",
      "skills/branch-cleanup.md: missing from architecture.md's Level 1 list",
      "skills/new-skill.md: `name:` should be `new-skill`",
      "skills/new-skill.md: missing from AGENTS.md's \"Skills in this playbook\" table",
      "CONTRIBUTING.md: link to `./docs/no-such-file.md` points nowhere",
    ]) {
      assert.ok(result.stderr.includes(expected), `expected "${expected}" in:\n${result.stderr}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ignores links inside code, and the two kinds that point nowhere on purpose", () => {
  const dir = scratchCopy();
  try {
    appendFileSync(join(dir, "CONTRIBUTING.md"), "\n```md\n[a template link](./nowhere.md)\n```\nAnd `[inline](./nowhere-either.md)`.\n");
    assert.equal(run(dir).status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
