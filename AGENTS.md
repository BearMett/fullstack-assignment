# AGENTS.md

상상단 단톡방 모임 신청 시스템 — pnpm workspace monorepo.

## Project overview

| Layer | Path | Stack |
|-------|------|-------|
| Backend | `apps/server/` | NestJS v11, TypeORM, SQLite (better-sqlite3), Jest |
| Frontend | `apps/web/` | Next.js 16 App Router, React 19, Tailwind CSS v4 |
| Shared | `packages/shared/` | DTOs, types, utilities |

Language: TypeScript 5. Package manager: pnpm.

## Working in this repo

### Am I in a worktree?

Check for `.env.worktree` at the repo root.

| `.env.worktree` exists? | You are in… | Ports to use |
|---|---|---|
| No | The source checkout | defaults — backend `4000`, frontend `3000` |
| Yes | A worktree | read `PORT` and `NEXT_PUBLIC_API_URL` from `.env.worktree` |

### Source checkout workflow

Do not implement directly on `main`. Create a worktree first:

```bash
scripts/new-worktree.sh <task-id> [base-branch]   # creates worktree + installs deps
scripts/dev-server.sh <task-id>                    # start backend on slot port
scripts/dev-web.sh <task-id>                       # start frontend on slot port
scripts/rm-worktree.sh <task-id> [--force]         # remove worktree + branch + slot
scripts/rm-worktree.sh --list                      # show active slots
```

Slot pool: 100 slots. Backend ports `4001–4100`, frontend ports `3001–3100`. Worktrees are not auto-cleaned; use `rm-worktree.sh` to reclaim when needed.

### Worktree workflow

You are already on a feature branch. Do not create nested worktrees. Start servers directly:

```bash
source .env.worktree
pnpm --filter server start:dev                                          # uses $PORT
pnpm --filter web dev -- --hostname 127.0.0.1 --port $WORKTREE_FRONTEND_PORT
```

Or `pnpm dev` after sourcing `.env.worktree` to run both.

## Commands

| Action | Command |
|--------|---------|
| Install deps | `pnpm install` |
| Dev (all) | `pnpm dev` |
| Build all | `pnpm build` |
| Lint all | `pnpm lint` |
| Test all | `pnpm test` |
| Backend dev | `pnpm --filter server start:dev` |
| Backend build | `pnpm --filter server build` |
| Backend test | `pnpm --filter server test` |
| Backend single test | `cd apps/server && npx jest src/path/to.spec.ts` |
| Frontend dev | `pnpm --filter web dev` |
| Frontend build | `pnpm --filter web build` |
| Frontend lint | `pnpm --filter web lint` |

No frontend test runner is configured.

## Source layout

**Backend** (`apps/server/src/`): `config/` env & TypeORM config · `constants/` API & DB constants · `entity/` TypeORM entities (barrel-exported from `entity/index.ts`) · `modules/` NestJS feature modules · `main.ts` entry point.

**Frontend** (`apps/web/`): `app/` App Router pages & layouts · `lib/api-client/` axios-based API client · `lib/react-query/` provider & hooks · `lib/store/` Zustand stores.

**Shared** (`packages/shared/src/`): `dto/` · `types/` · `util/`.

## Environment variables

| Variable | Where | Default |
|----------|-------|---------|
| `PORT` | `apps/server/.env` | `4000` |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env.local` | `http://localhost:4000/api` |

In worktrees, `.env.worktree` overrides both with slot-assigned values.

## Code conventions

- **Formatting**: Prettier at root (`.prettierrc`). Double quotes, semicolons. Do not reformat unrelated code.
- **TypeScript**: `strict` mode in frontend. No `any`, `@ts-ignore`, `@ts-expect-error`.
- **React**: server components by default; `"use client"` only when hooks or browser APIs require it.
- **Entities**: place in `apps/server/src/entity/`, export from `entity/index.ts`. This is the only allowed barrel export — do not add barrel exports elsewhere.
- **Modules**: place in `apps/server/src/modules/`, import in `app.module.ts`.
- **Validation**: class-validator decorators. **Serialization**: class-transformer.
- **Naming**: React components `PascalCase` · TS functions/vars `camelCase` · NestJS classes `PascalCase`, files `kebab-case` · entities `kebab-case.entity.ts` · tests `kebab-case.spec.ts`.
- **Errors**: backend uses NestJS HTTP exceptions; frontend goes through `lib/api-client/`. No silent catches.
- **Korean copy**: preserve unless explicitly asked to change.

## Change guidance

- API shape changes → update backend DTOs, `lib/api-client/`, and `packages/shared/` together.
- Delete `_placeholder.entity.ts` and its export once real entities exist.
- No migration scripts. `synchronize: true` handles schema changes; revisit only if explicitly required.

## Verification checklist

Pick the smallest set that proves the change:

- **Frontend-only**: `pnpm --filter web lint && pnpm --filter web build`
- **Backend-only**: `pnpm --filter server test` (targeted first, full if broader)
- **Full-stack**: backend tests + frontend lint + frontend build

## Do not assume

- Frontend tests exist.
- A change in one app is reflected in the other.
- The SQLite file exists before first server start.
