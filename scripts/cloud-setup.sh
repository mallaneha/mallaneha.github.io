#!/bin/bash
# Paste into the claude.ai/code cloud environment's setup script (not run by the repo itself).
# Needs Custom network access with cdn.playwright.dev and playwright.download.prss.microsoft.com allowed.
set -e
npx -y playwright@latest install --with-deps chromium
