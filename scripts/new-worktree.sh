#!/usr/bin/env bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/worktree-common.sh"

[[ -n "${1:-}" ]] || { printf 'Usage: %s <task-id> [base-branch]\n' "$0" >&2; exit 1; }

tid="$(sanitize "$1")"
base="$(resolve_base_ref "${2:-}")"
branch="wt/$(sanitize "$base")/${tid}"
wdir="$(worktree_dir "$tid")"

ensure_slot "$tid"

if [[ -d "$wdir" ]]; then
  git -C "$wdir" rev-parse --is-inside-work-tree >/dev/null 2>&1 \
    || die "Path exists but is not a worktree: $wdir"
  printf 'Worktree reused\n'
else
  if git -C "$WORKSPACE_ROOT" show-ref --verify --quiet "refs/heads/${branch}"; then
    git -C "$WORKSPACE_ROOT" worktree add "$wdir" "$branch"
  else
    git -C "$WORKSPACE_ROOT" worktree add -b "$branch" "$wdir" "$base"
  fi
  printf 'Worktree created\n'
fi

write_env "$tid"

printf 'Installing dependencies...\n'
(cd "$wdir" && pnpm install --frozen-lockfile)

printf '\nTask:     %s\n' "$tid"
printf 'Branch:   %s\n' "$branch"
printf 'Path:     %s\n' "$wdir"
printf 'Backend:  http://127.0.0.1:%s\n' "$WORKTREE_BACKEND_PORT"
printf 'Frontend: http://127.0.0.1:%s\n' "$WORKTREE_FRONTEND_PORT"
