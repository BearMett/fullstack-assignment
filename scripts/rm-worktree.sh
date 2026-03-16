#!/usr/bin/env bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/worktree-common.sh"

usage() {
  printf 'Usage: %s <task-id> [--force]\n' "$0" >&2
  printf '       %s --list\n' "$0" >&2
  exit 1
}

list_slots() {
  if ! compgen -G "${SLOT_ROOT}/*.env" >/dev/null 2>&1; then
    printf 'No active worktree slots.\n'
    return
  fi
  printf '%-15s %-6s %-8s %-8s %s\n' "TASK" "SLOT" "BACKEND" "FRONTEND" "PATH"
  for f in "$SLOT_ROOT"/*.env; do
    set -a; . "$f"; set +a
    local wdir="$(worktree_dir "$WORKTREE_TASK_ID")"
    local exists="(missing)"
    [[ -d "$wdir" ]] && exists="$wdir"
    printf '%-15s %-6s %-8s %-8s %s\n' \
      "$WORKTREE_TASK_ID" "$WORKTREE_SLOT" "$WORKTREE_BACKEND_PORT" "$WORKTREE_FRONTEND_PORT" "$exists"
  done
}

main() {
  local raw="${1:-}"
  [[ -n "$raw" ]] || usage

  if [[ "$raw" == "--list" ]]; then
    list_slots
    return
  fi

  local force=0
  [[ "${2:-}" == "--force" ]] && force=1

  local tid wdir sf branch
  tid="$(sanitize "$raw")"
  wdir="$(worktree_dir "$tid")"
  sf="$(slot_file "$tid")"

  if [[ -d "$wdir" ]]; then
    if [[ "$force" -eq 1 ]]; then
      git worktree remove --force "$wdir"
    else
      git worktree remove "$wdir" || die "Worktree has changes. Use --force to discard, or commit/stash first."
    fi
    printf 'Removed worktree: %s\n' "$wdir"
  else
    printf 'No worktree directory at %s\n' "$wdir"
  fi

  # Clean up the branch if it exists and is fully merged
  if [[ -f "$sf" ]]; then
    load_slot "$sf"
    branch="$(git -C "$WORKSPACE_ROOT" branch --list "wt/*/${tid}" | tr -d ' ')"
    if [[ -n "$branch" ]]; then
      if git -C "$WORKSPACE_ROOT" branch -d "$branch" 2>/dev/null; then
        printf 'Deleted branch: %s\n' "$branch"
      else
        printf 'Branch %s not fully merged; kept. Use git branch -D to force-delete.\n' "$branch"
      fi
    fi
  fi

  if [[ -f "$sf" ]]; then
    rm "$sf"
    printf 'Removed slot: %s\n' "$sf"
  fi
}

main "$@"
