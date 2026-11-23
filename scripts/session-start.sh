#!/bin/bash
# SessionStart hook. Installs deps in cloud sessions only; locally you manage node_modules yourself.
[ "$CLAUDE_CODE_REMOTE" != "true" ] && exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
[ -d node_modules ] || npm ci
npx playwright install chromium # no-op when cached
exit 0
