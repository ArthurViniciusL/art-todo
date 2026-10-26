---
name: ipc-endpoint
description: Add or change a typed IPC channel between the Electron main process and the React renderer in Art Todo. Use whenever the renderer needs new data or a new action from the database or the OS (dialogs, clipboard, files), or when a channel's arguments or return type change.
---

# Add a typed IPC endpoint

The renderer never touches Node or the database. Every call goes through one generic `window.api.invoke(channel, ...args)`. See `docs/adr/0003-typed-ipc.md`.

## Steps

1. **Contract** in `src/shared/ipc.ts`:
   - Add the channel to `IpcContract` as `'domain:action': (arg: Type) => Result`. Name it `<domain>:<verb>` (`tasks:update`, `export:saveMarkdown`).
   - Add the same string to `IPC_CHANNELS`. The `channelsAreComplete` check fails to compile if you forget.
   - Put new domain types in `src/shared/domain.ts`, never in main or renderer code.

2. **Validator** in `src/shared/validate.ts`:
   - Every argument arrives as `unknown`. Add or reuse a guard that throws `ValidationError`.
   - Keep only known fields (see `taskPatch`). Add a case to `src/shared/validate.test.ts`.

3. **Handler** in `src/main/ipc.ts`:
   - Add an entry to the `handlers` object. TypeScript errors until every channel has one.
   - Validate every argument, then call a repository (`src/main/db/repositories/`) or an Electron API. No SQL in the handler.
   - Database logic goes in the repository, with a test next to it (`*.test.ts`, using `openTestDatabase()`).

4. **Hook** in `src/renderer/src/hooks/queries.ts`:
   - Reads: `useQuery` with a key from `queryKeys`. Add a key factory if needed.
   - Writes: `useMutation`. Task writes go through `useTaskMutation`, which invalidates all `['tasks']` queries. List writes invalidate `queryKeys.lists`.
   - Call `invoke()` from `src/renderer/src/lib/api.ts`. Never call `window.api` directly from components.

5. **Do not touch** `src/preload/index.ts`. It forwards any channel in `IPC_CHANNELS`.

For a message from main to the renderer (no reply), add it to `IpcEvents` and `IPC_EVENTS` in `src/shared/ipc.ts`, send it with `webContents.send(event, payload)`, and subscribe in the renderer with `onEvent()` from `src/renderer/src/lib/api.ts` inside a `useEffect`.

## Check

- `pnpm typecheck && pnpm test`
- If the channel is user-facing, cover it in an E2E test (`e2e/`, launched with `launchApp()` from `e2e/fixtures.ts`). Remember that `pnpm test:e2e` rebuilds the app.
