# ADR-0003: Typed IPC contract between main and renderer

**Status:** Accepted
**Date:** 2026-10-23
**Deciders:** Arthur Vinicius

## Context

The renderer must never touch Node or the database. It needs a safe, typed way to call data operations in the main process.

## Decision

- `contextIsolation: true` and `sandbox: true`. The preload exposes one `window.api.invoke(channel, ...args)` function through `contextBridge`.
- `src/shared/ipc.ts` holds the contract: the `IpcContract` interface maps every channel to its argument and return types, and `IPC_CHANNELS` lists them at runtime. A compile-time check fails if the two drift apart.
- The preload rejects any channel that is not in `IPC_CHANNELS`.
- `src/main/ipc.ts` implements every channel. The `Handlers` type forces one handler per channel. Handlers receive `unknown` arguments and validate them with `src/shared/validate.ts` before calling a repository.
- Main-to-renderer messages (added in phase 11 for reminder clicks) follow the same pattern: `IpcEvents` maps each event to its payload, `IPC_EVENTS` lists them, and the preload's `window.api.on(event, listener)` refuses anything else and passes only the payload. The renderer subscribes with `onEvent()` from `src/renderer/src/lib/api.ts`.
- The renderer calls `invoke()` from `src/renderer/src/lib/api.ts` through TanStack Query hooks in `src/renderer/src/hooks/queries.ts`, and invalidates queries after mutations. Zustand holds UI state only (selection, open modal, view filters).

## Options Considered

### Option A: Hand-written typed contract (chosen)

**Pros:** No extra dependency; the contract is small and explicit.
**Cons:** Each endpoint touches three places (contract, handler, hook). The generic `invoke` means the preload never changes. The `ipc-endpoint` project skill keeps the steps consistent.

### Option B: tRPC over IPC (electron-trpc)

**Pros:** Less boilerplate.
**Cons:** Extra dependency with uncertain Electron 45 support; more magic to debug.

## Consequences

- Easier: type errors surface at compile time across processes.
- Harder: adding an endpoint needs three edits plus a validator.
- Revisit: if the contract grows past ~40 channels, split it by domain.

## Action Items

1. [x] Implement contract, handlers and preload (phase 2).
2. [ ] Create the `ipc-endpoint` project skill.
