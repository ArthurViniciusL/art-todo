---
name: feature-workflow
description: The end-to-end workflow for delivering an Art Todo roadmap phase or feature, from branch to pull request. Use when starting any phase from docs/plan.md or any feature that will become its own PR.
---

# Deliver a feature or roadmap phase

Spec and roadmap: `docs/plan.md`. Conventions: `CLAUDE.md`.

## Steps

1. **Start from fresh main.**
   ```bash
   git checkout main && git pull
   git checkout -b phase-<n>-<short-name>
   ```
2. **Re-read the spec** for this phase in `docs/plan.md`. List the acceptance points before coding. If the spec is ambiguous, ask the user instead of guessing.
3. **Build in layers**, each with tests:
   - Schema changes: the `db-migration` skill.
   - Data access: repository + `*.test.ts`.
   - New IPC: the `ipc-endpoint` skill.
   - UI: the `ui-component` skill.
4. **Write the E2E test** for the main user flow in `e2e/` with `launchApp()` from `e2e/fixtures.ts`. Each test gets an isolated profile.
5. **Run all checks:**
   ```bash
   pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e
   ```
6. **Look at it.** Run the app (`pnpm dev`) or take Playwright screenshots in light and dark, and check the result against the spec.
7. **Clean up.** Run the `simplify` skill, then the `code-review` skill on the diff. Fix what they find.
8. **Update docs** if a decision changed: `docs/adr/` (new ADR or update), `docs/design-tokens.md`, `CLAUDE.md`, and the project skills in `.claude/skills/`.
9. **Commit and open the PR.** Use a conventional commit title (`feat:`, `fix:`, `chore:`). The PR body has a summary, notes on anything deferred, and a test plan with what was actually run.
   ```bash
   git push -u origin HEAD
   gh pr create --title "Phase <n>: <name>" --body "..."
   ```
10. **Merge only when the user approves** (squash merge, delete the branch).

## Gotchas

- If `pnpm build` fails with `electron-vite: Permission denied`, a pnpm reinstall dropped the exec bit: `chmod +x node_modules/electron-vite/bin/electron-vite.js`.
