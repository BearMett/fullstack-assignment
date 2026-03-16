#!/usr/bin/env bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/worktree-common.sh"

[[ -n "${1:-}" ]] || { printf 'Usage: %s <task-id>\n' "$0" >&2; exit 1; }

tid="$(sanitize "$1")"
wdir="$(worktree_dir "$tid")"
[[ -d "$wdir" ]] || die "Missing worktree: $wdir"

load_slot "$(slot_file "$tid")"
fp="$(find_free_port "$WORKTREE_FRONTEND_PORT" "$((FRONTEND_PORT_BASE + MAX_SLOT))")"

if [[ "$fp" -ne "$WORKTREE_FRONTEND_PORT" ]]; then
  printf 'Port %s in use, using %s instead\n' "$WORKTREE_FRONTEND_PORT" "$fp"
fi

# Read backend port from .env.worktree (stable, written once by new-worktree.sh)
ef="$(env_file "$tid")"
bp="$WORKTREE_BACKEND_PORT"
if [[ -f "$ef" ]]; then
  bp="$(grep '^PORT=' "$ef" | cut -d= -f2 || echo "$bp")"
fi

printf 'Frontend: http://127.0.0.1:%s → Backend: http://127.0.0.1:%s/api\n' "$fp" "$bp"
export NEXT_PUBLIC_API_URL="http://127.0.0.1:${bp}/api"

cd "$wdir"
exec pnpm --filter web dev -- --hostname 127.0.0.1 --port "$fp"
