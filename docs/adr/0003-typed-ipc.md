# ADR-0003: Typed IPC contract between main and renderer

**Status:** Accepted
**Date:** 2026-10-23
**Deciders:** Arthur Vinicius

## Context

The renderer must never touch Node or the database. It needs a safe, typed way to call data operations in the main process.

## Decision

- `contextIsolation: true` and `sandbox: true`. The preload exposes one `window.api` object through `contextBridge`.
- One shared contract file in `src/shared/` defines every channel name with its argument and return types.
- The main process registers handlers with `ipcMain.handle`. The preload maps each channel to `ipcRenderer.invoke`.
- The renderer reads data with TanStack Query hooks over `window.api` and invalidates queries after mutations. Zustand holds UI state only (selection, open modal, view filters).
- Inputs are validated in the main handler before reaching the DB.

## Options Considered

### Option A: Hand-written typed contract (chosen)

**Pros:** No extra dependency; the contract is small and explicit.
**Cons:** Each endpoint touches four places (contract, handler, preload, hook). The `ipc-endpoint` project skill keeps that consistent.

### Option B: tRPC over IPC (electron-trpc)

**Pros:** Less boilerplate.
**Cons:** Extra dependency with uncertain Electron 45 support; more magic to debug.

## Consequences

- Easier: type errors surface at compile time across processes.
- Harder: adding an endpoint needs four edits.
- Revisit: if endpoints exceed ~40, consider generating the preload from the contract.

## Action Items

1. [ ] Implement contract, handlers and preload (phase 2).
2. [ ] Create the `ipc-endpoint` project skill.
