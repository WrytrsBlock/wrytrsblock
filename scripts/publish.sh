#!/usr/bin/env bash
#
# WrytrsBlock — one-command publish.
# Commits any changes, pushes to the production branch (main), and triggers a
# Vercel production deploy. After a coding session just run:
#
#   npm run publish                 # auto timestamp commit message
#   npm run publish -- "your note"  # custom commit message
#
set -uo pipefail

BRANCH="main"
RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; CYAN=$'\033[36m'; BOLD=$'\033[1m'; RESET=$'\033[0m'

fail() { printf '%s\n' "${RED}${BOLD}✗ Publish failed:${RESET} $1" >&2; exit 1; }
step() { printf '%s\n' "${CYAN}•${RESET} $1"; }
ok()   { printf '%s\n' "${GREEN}✓${RESET} $1"; }

# Always operate from the repo root.
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || fail "not inside a git repository"
cd "$ROOT" || fail "could not cd to repo root"

# Must be on the production branch so we never publish from a feature branch by
# accident — that was the original bug.
CURRENT="$(git branch --show-current)"
if [ "$CURRENT" != "$BRANCH" ]; then
  fail "you're on '${CURRENT}', not '${BRANCH}'. Switch first:  git checkout ${BRANCH}"
fi

printf '%s\n' "${BOLD}Publishing WrytrsBlock → ${BRANCH}${RESET}"

# 1. Stage + commit any changes (a no-op commit is fine to skip).
MSG="${1:-Publish: $(date '+%Y-%m-%d %H:%M')}"
git add -A || fail "git add failed"
if git diff --cached --quiet; then
  printf '%s\n' "${YELLOW}•${RESET} No new changes to commit — publishing what's already committed."
else
  git commit -m "$MSG" >/dev/null || fail "git commit failed"
  ok "Committed: ${MSG}"
fi

# 2. Push to production branch.
step "Pushing to origin/${BRANCH}…"
if ! git push origin "$BRANCH"; then
  fail "git push was rejected. Common causes: GitHub auth expired, no network, or the remote moved ahead (run 'git pull --rebase origin ${BRANCH}' and retry)."
fi
ok "Pushed to origin/${BRANCH}"

# 3. Trigger the Vercel production deploy.
#    - If the Vercel CLI is installed AND a VERCEL_TOKEN is set, deploy
#      explicitly and print the live URL.
#    - Otherwise rely on Vercel's GitHub integration (push to main auto-deploys
#      production) and tell the user where to look.
if command -v vercel >/dev/null 2>&1 && [ -n "${VERCEL_TOKEN:-}" ]; then
  step "Deploying to Vercel production…"
  if ! DEPLOY_URL="$(vercel deploy --prod --yes --token "$VERCEL_TOKEN" 2>&1 | tail -n 1)"; then
    fail "Vercel deploy failed: ${DEPLOY_URL}"
  fi
  ok "Live: ${DEPLOY_URL}"
else
  ok "Vercel's GitHub integration will deploy ${BRANCH} to production in ~1–2 min."
  printf '   %s\n' "${YELLOW}Tip:${RESET} install the Vercel CLI and set VERCEL_TOKEN to print the live URL here."
fi

printf '\n%s\n' "${GREEN}${BOLD}🎉 Publish complete.${RESET}"
