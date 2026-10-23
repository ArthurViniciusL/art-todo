# ADR-0002: Local persistence — SQLite via better-sqlite3 + Drizzle ORM

**Status:** Accepted
**Date:** 2026-10-23
**Deciders:** Arthur Vinicius

## Context

All data stays on the user's machine. The app needs queries by date (Today, Upcoming), by status, and manual ordering per list. The schema will grow in v2 (tags, subtasks, reminders, recurrence), so migrations are required.

## Decision

- SQLite through `better-sqlite3`, opened only in the Electron main process.
- Drizzle ORM for a typed schema and generated SQL migrations (`drizzle-kit`).
- The database file lives at `app.getPath('userData')/art-todo.db`. Migrations run on startup.
- The schema includes `tasks.status` (`todo`|`doing`|`done`) and `tasks.due_time` from the start, to avoid early migrations.

## Options Considered

### Option A: better-sqlite3 + Drizzle (chosen)

| Dimension        | Assessment                      |
| ---------------- | ------------------------------- |
| Complexity       | Medium (native module rebuild)  |
| Cost             | Free                            |
| Scalability      | Far beyond a personal todo list |
| Team familiarity | Good                            |

**Pros:** Relational queries, synchronous fast API, typed end to end, real migrations.
**Cons:** Native module must match the Electron ABI; electron-builder rebuilds it.

### Option B: JSON file (electron-store / lowdb)

**Pros:** Zero setup.
**Cons:** Whole-file rewrites, no queries, hand-written migrations.

### Option C: `node:sqlite`

**Pros:** No native rebuild.
**Cons:** Still experimental; weaker ORM support.

### Option D: IndexedDB in the renderer

**Pros:** No native module.
**Cons:** Harder to back up and inspect; data logic would live in the UI process.

## Trade-off Analysis

The native rebuild cost is paid once and automated by `electron-builder install-app-deps`. Typed queries and migrations pay off on every feature.

## Consequences

- Easier: date and status views are plain SQL; v2 schema growth is a migration.
- Harder: tests that touch the DB need the Node ABI build or an in-memory DB.
- Revisit: backup/import JSON in v2.

## Action Items

1. [ ] Schema, migrations and repository layer (phase 2).
2. [ ] Create the `db-migration` project skill.
