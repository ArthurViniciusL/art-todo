# Art Todo — guide for Claude

Local, offline todo list desktop app. Electron 45 + electron-vite + React 19 + TypeScript + HeroUI v3 (React Aria) + Tailwind CSS v4. Ships as a Linux `.deb`.

The full product spec and roadmap is in `docs/plan.md`. Architecture decisions are in `docs/adr/`. Read both before starting a phase.

## Commands

- `pnpm dev`: run the app with HMR.
- `pnpm lint` · `pnpm typecheck` · `pnpm test` (Vitest) · `pnpm test:e2e` (build + Playwright Electron).
- `pnpm build:linux`: build `dist/art-todo_<version>_amd64.deb`.
- Use pnpm only. `pnpm-workspace.yaml` sets `nodeLinker: hoisted` (needed by Electron packaging) and `allowBuilds` for native modules. Add a native dependency there before installing it.

## Layout

- `src/main/`: Electron main process. Owns the SQLite database and all Node access.
- `src/preload/`: exposes `window.api` through `contextBridge`. No logic here.
- `src/renderer/src/`: React UI. No Node or DB access; data comes only through `window.api`.
- `src/shared/`: types and pure logic shared by main and renderer (IPC contract, domain types, Markdown export).
- `e2e/`: Playwright Electron tests. Unit tests sit next to the code as `*.test.ts`.

## Conventions

- Code, comments, commits and docs in English. All user-facing text in PT-BR.
- Security: `contextIsolation` and `sandbox` stay on. Validate IPC inputs in the main process.
- Data in the renderer: TanStack Query over `window.api`. Zustand only for UI state.
- Use HeroUI / React Aria components before writing custom ones. Icons come from `lucide-react`.
- Colors come from design tokens, never raw hex in components. The accent `#FFCA39` is a fill color; text on it is dark. In light theme, accent text uses the dark accent token.
- Every interaction must work by keyboard.

## Workflow

- One branch and one PR per roadmap phase (`phase-N-short-name`). CI must be green before merge.
- Before opening a PR, run `simplify` and `code-review`, then lint, typecheck and tests.
- Releases: push a `v*` tag; `.github/workflows/release.yml` publishes the `.deb` to GitHub Releases.
