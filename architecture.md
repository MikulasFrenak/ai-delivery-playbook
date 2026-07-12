AI Delivery Playbook
Built with frontend and mobile delivery in mind, but designed to be technology-agnostic and extensible.

Prerequisites
========
Setup
-----
Capabilities depend on MCP servers being configured
(chrome-devtools, issue tracker, design tool, ...)
See docs/mcp-servers.md

Capabilities also depend on project conventions
being documented (branching, testing, styling, ...)
See AGENTS.md

↓
required by
↓

Level 1
========
Capabilities
------------
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
trigger → workflow → capabilities → tools → human confirmation.
See examples/
