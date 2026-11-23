#!/usr/bin/env bash
# Stop hook: block the agent from ending its turn while there are changes and `npm run check` fails.
# Exit 2 sends stderr back to Claude so it keeps fixing. Runs in the session's cwd (its worktree).
input=$(cat)
cd "$(echo "$input" | jq -r '.cwd')" || exit 0
# Nothing changed (tracked or untracked)? Let the turn end.
[ -z "$(git status --porcelain 2>/dev/null)" ] && exit 0
[ -d node_modules ] || exit 0
# Use the Node version pinned in .nvmrc (Astro needs a newer one than many default installs).
if [ -f .nvmrc ] && [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh" >/dev/null 2>&1
  nvm use >/dev/null 2>&1 || nvm install >/dev/null 2>&1
fi
if ! out=$(npm run -s check 2>&1); then
  echo "npm run check failed. Fix before finishing:" >&2
  echo "$out" | tail -40 >&2
  exit 2
fi
exit 0
