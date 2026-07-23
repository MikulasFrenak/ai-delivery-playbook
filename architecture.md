AI Delivery Playbook
Built with frontend and mobile delivery in mind, but designed to be technology-agnostic and extensible.

Prerequisites
========
Setup
-----
Skills depend on MCP servers being configured
(chrome-devtools, issue tracker, design tool, ...)
See docs/mcp-servers.md

Skills also depend on project conventions
being documented (branching, testing, styling, ...)
See AGENTS.md

↓
required by
↓

Level 1
========
Skills
------
analyze-story
create-task
implement-task
verify-browser
commit
pr-update
code-doc
public-repo-check
generate-agents-md
...

↓
combined into
↓

Level 2
========
Workflows
---------
feature-delivery
bugfix
design-system-update
...

↓
executed during
↓

Level 3
========
Software Delivery Lifecycle
----------------------------
Requirements
Architecture
Implementation
Verification
Release

↓
demonstrated by
↓

Level 4
========
Worked Examples
----------------
Real traces of a workflow run end to end —
trigger → workflow → skills → tools → human confirmation.
See examples/

---

Level 1 skills are also servable directly over MCP — search and
fetch skills/*.md at runtime instead of cloning the repo and
copying files into .claude/skills/. See mcp-server/
