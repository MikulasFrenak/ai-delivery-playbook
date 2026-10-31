#!/usr/bin/env bash
# Asks a deployed MCP server for one skill over Streamable HTTP, the way a client would. A fresh deploy can take a few
# seconds to answer, so it tries for about 30 s.
set -uo pipefail
url="$1"
for attempt in 1 2 3 4 5 6; do
  if curl -s "$url" -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_skill","arguments":{"skill_id":"commit"}}}' |
    grep -q 'name: commit'; then
    echo "OK — $url serves the skills."
    exit 0
  fi
  sleep 5
done
echo "::error::$url didn't return the commit skill."
exit 1
