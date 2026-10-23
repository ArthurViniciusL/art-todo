# ADR-0001: Desktop stack — Electron + electron-vite + React + HeroUI v3

**Status:** Accepted
**Date:** 2026-10-23
**Deciders:** Arthur Vinicius

## Context

Art Todo is a local, offline todo list app. It ships first as a Linux `.deb`, with Windows and macOS possible later. The UI must follow a calm, minimal direction (Things/Linear) with a yellow accent (`#FFCA39`), and it must be fully keyboard accessible. Claude builds most of the code, so the stack must be mainstream and well typed.

## Decision

- Electron 45, built with electron-vite 6 and packaged with electron-builder (Linux `deb` target only for now).
- React 19 + TypeScript in the renderer.
- HeroUI v3 (built on React Aria) + Tailwind CSS v4 for components and styling. Lucide for icons.
- pnpm with `nodeLinker: hoisted`, which Electron packaging needs.

## Options Considered

### Option A: React + HeroUI v3 (chosen)

| Dimension        | Assessment                            |
| ---------------- | ------------------------------------- |
| Complexity       | Medium                                |
| Cost             | Free, open source                     |
| Scalability      | Good for a single-window app          |
| Team familiarity | High; React has the largest ecosystem |

**Pros:** React Aria gives accessible menus, popovers, DnD and keyboard navigation. Tailwind v4 makes design tokens simple CSS variables.
**Cons:** HeroUI v3 is recent; some components may need custom work.

### Option B: Svelte or Vue + Vite

**Pros:** Smaller bundles, simpler reactivity.
**Cons:** Fewer accessible component libraries at the React Aria level; less training data for code generation.

### Option C: Vanilla TypeScript

**Pros:** No framework overhead.
**Cons:** Command palette, DnD, modals and three view modes would be hand-built.

## Trade-off Analysis

Bundle size matters little in a desktop app. Accessibility and keyboard support matter a lot, because the app is keyboard first. React Aria through HeroUI covers that best.

## Consequences

- Easier: accessible popovers, menus, tooltips and DnD out of the box.
- Harder: Tailwind v4 + HeroUI v3 theming must be set up with care to hit WCAG contrast with a yellow accent.
- Revisit: adding `win`/`mac` targets to `electron-builder.yml`.

## Action Items

1. [x] Scaffold with electron-vite `react-ts` template.
2. [ ] Define design tokens (phase 1).
