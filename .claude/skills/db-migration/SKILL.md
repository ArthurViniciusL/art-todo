---
name: db-migration
description: Change the Art Todo SQLite schema (add a table, column or index) with Drizzle ORM and generate a migration. Use for any change to src/main/db/schema.ts, including v2 features like tags, subtasks, reminders or recurrence.
---

# Change the database schema

SQLite via `better-sqlite3` + Drizzle ORM. Schema: `src/main/db/schema.ts`. Migrations: `resources/migrations/` (generated, committed, shipped inside the app). See `docs/adr/0002-local-data-sqlite-drizzle.md`.

## Steps

1. Edit `src/main/db/schema.ts`.
   - Column names in `snake_case`, TypeScript keys in `camelCase`.
   - Timestamps are integer milliseconds. Use the `now` default for creation times.
   - New `NOT NULL` columns need a default, because existing user databases have rows.
   - Enums use `text(..., { enum: [...] })` and must match the union in `src/shared/domain.ts`.
2. Update the matching type in `src/shared/domain.ts`, and any validator in `src/shared/validate.ts`.
3. Generate the migration with a short snake_case name:
   ```bash
   pnpm db:generate --name add_tags
   ```
4. Read the generated SQL in `resources/migrations/`. Check that it does not drop or recreate a table that holds user data. If Drizzle rebuilds a table, make sure the generated SQL copies the rows.
5. Never edit or delete a migration that is already on `main`. Fix mistakes with a new migration.
6. Update the repository in `src/main/db/repositories/` and its test.

## Check

- `pnpm test`: tests open a fresh in-memory DB with all migrations (`openTestDatabase()`).
- Upgrade test: run the app on a profile created before the change, then confirm it starts and keeps its data:
  ```bash
  ART_TODO_USER_DATA=/tmp/art-todo-old pnpm dev
  ```

## Gotchas

- Tests run under Electron's Node (`ELECTRON_RUN_AS_NODE=1`), because `better-sqlite3` is built for Electron's ABI. Do not run `vitest` directly.
- A new native module must be added to `allowBuilds` in `pnpm-workspace.yaml` first.
