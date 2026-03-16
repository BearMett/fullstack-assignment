#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKTREE_ROOT="${WORKSPACE_ROOT}/worktree"
SLOT_ROOT="${WORKTREE_ROOT}/.slots"
FRONTEND_PORT_BASE=3000
BACKEND_PORT_BASE=4000
MAX_SLOT=100

die() { printf 'Error: %s\n' "$*" >&2; exit 1; }

sanitize() {
  local v
  v="$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]' | tr '/[:space:]' '--' | tr -cd 'a-z0-9._-')"
  v="$(printf '%s' "$v" | sed -E 's/[-_.]{2,}/-/g; s/^[-_.]+//; s/[-_.]+$//')"
  [[ -n "$v" ]] || die "Value resolves to empty"
  printf '%s\n' "$v"
}

resolve_base_ref() {
  if [[ -n "${1:-}" ]]; then printf '%s\n' "$1"; return; fi
  local b; b="$(git -C "$WORKSPACE_ROOT" branch --show-current)"
  [[ -n "$b" ]] || die "Detached HEAD; pass an explicit base branch"
  printf '%s\n' "$b"
}

worktree_dir()  { printf '%s/%s\n' "$WORKTREE_ROOT" "$1"; }
slot_file()     { printf '%s/%s.env\n' "$SLOT_ROOT" "$1"; }
env_file()      { printf '%s/.env.worktree\n' "$(worktree_dir "$1")"; }

load_slot() {
  local f="$1"
  [[ -f "$f" ]] || die "Missing slot file: $f"
  set -a; . "$f"; set +a
}

find_next_slot() {
  local used=' ' s f
  if compgen -G "${SLOT_ROOT}/*.env" >/dev/null 2>&1; then
    for f in "$SLOT_ROOT"/*.env; do
      s="$(grep '^WORKTREE_SLOT=' "$f" | cut -d= -f2)"
      used+="${s} "
    done
  fi
  for s in $(seq 1 "$MAX_SLOT"); do
    [[ "$used" != *" ${s} "* ]] && { printf '%s\n' "$s"; return 0; }
  done
  die "All ${MAX_SLOT} worktree slots in use"
}

ensure_slot() {
  local tid="$1" sf
  mkdir -p "$SLOT_ROOT"
  sf="$(slot_file "$tid")"
  if [[ -f "$sf" ]]; then load_slot "$sf"; return; fi

  local s; s="$(find_next_slot)"
  local fp=$((FRONTEND_PORT_BASE + s)) bp=$((BACKEND_PORT_BASE + s))
  cat >"$sf" <<EOF
WORKTREE_TASK_ID=${tid}
WORKTREE_SLOT=${s}
WORKTREE_FRONTEND_PORT=${fp}
WORKTREE_BACKEND_PORT=${bp}
EOF
  load_slot "$sf"
}

port_in_use() {
  lsof -iTCP:"$1" -sTCP:LISTEN -t >/dev/null 2>&1
}

find_free_port() {
  local port="$1" max="$2"
  while port_in_use "$port"; do
    port=$((port + 1))
    [[ "$port" -le "$max" ]] || die "No free port in range up to $max"
  done
  printf '%s\n' "$port"
}

# Write .env.worktree — called once by new-worktree.sh, not by dev scripts.
write_env() {
  local tid="$1"
  load_slot "$(slot_file "$tid")"
  cat >"$(env_file "$tid")" <<EOF
WORKTREE_TASK_ID=${WORKTREE_TASK_ID}
WORKTREE_SLOT=${WORKTREE_SLOT}
WORKTREE_FRONTEND_PORT=${WORKTREE_FRONTEND_PORT}
WORKTREE_BACKEND_PORT=${WORKTREE_BACKEND_PORT}
PORT=${WORKTREE_BACKEND_PORT}
NEXT_PUBLIC_API_URL=http://127.0.0.1:${WORKTREE_BACKEND_PORT}/api
EOF
}
