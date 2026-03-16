#!/usr/bin/env bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/worktree-common.sh"

[[ -n "${1:-}" ]] || { printf 'Usage: %s <task-id>\n' "$0" >&2; exit 1; }

tid="$(sanitize "$1")"
wdir="$(worktree_dir "$tid")"
[[ -d "$wdir" ]] || die "Missing worktree: $wdir"

load_slot "$(slot_file "$tid")"
bp="$(find_free_port "$WORKTREE_BACKEND_PORT" "$((BACKEND_PORT_BASE + MAX_SLOT))")"

if [[ "$bp" -ne "$WORKTREE_BACKEND_PORT" ]]; then
  printf 'Port %s in use, using %s instead\n' "$WORKTREE_BACKEND_PORT" "$bp"
fi

printf 'Backend: http://127.0.0.1:%s/api\n' "$bp"
export PORT="$bp"

cd "$wdir"
exec pnpm --filter server start:dev
