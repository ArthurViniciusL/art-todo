---
name: ui-component
description: Build or restyle a React UI component in Art Todo using HeroUI v3, Tailwind v4 and the project design tokens. Use for any new screen element (task row, card, column, modal, menu, toast, command palette) or visual change.
---

# Build a UI component

Stack: HeroUI v3 (React Aria) + Tailwind CSS v4 + `lucide-react`. Tokens: `src/renderer/src/assets/main.css`, documented in `docs/design-tokens.md`. Direction: minimal and calm (Things / Linear), with small animations only where they mean something.

## Rules

1. **Reuse first.** Check `@heroui/react` before writing anything custom: `Button`, `Tooltip`, `Menu`, `Dropdown`, `Popover`, `Modal`, `AlertDialog`, `Toast`, `ToggleButtonGroup`, `ListBox`, `TextField`, `DatePicker`, `TimeField`, `Kbd`, `Chip`, `Card`. Many are compound components (`<Tooltip.Content>`). Read the types in `node_modules/@heroui/react/dist/components/<name>/` when unsure.
2. **Colors only from tokens.** Use Tailwind classes such as `bg-background`, `bg-surface`, `bg-sidebar`, `bg-sidebar-active`, `text-foreground`, `text-muted`, `bg-accent text-accent-foreground`, `text-accent-text`, `ring-focus`, `text-priority-high`. No raw hex values in components. A new color becomes a token in `main.css` (light and dark) plus a row in `docs/design-tokens.md` with its contrast ratio.
3. **Accent contrast.** `#FFCA39` is a fill only. Text and thin icons in accent color use `text-accent-text`. Text on an accent fill uses `text-accent-foreground`.
4. **Keyboard and screen readers.** Every action works by keyboard, focus is visible (`focus-visible:ring-2 ring-focus`), icon-only buttons have `aria-label`, decorative icons have `aria-hidden`. Prefer React Aria components, which handle this.
5. **Copy in PT-BR**, short and calm, sentence case ("Nova tarefa", not "NOVA TAREFA").
6. **Typing**: components are function declarations with `Props` interfaces and a `React.JSX.Element` return type.
7. **State**: server data comes from hooks in `src/renderer/src/hooks/queries.ts`. UI-only state goes in `src/renderer/src/stores/ui.ts` (Zustand). Constants shared between components go in their own module, never exported from a component file (react-refresh lint rule).
8. **Motion**: keep animations short (150–250 ms) and respect `motion-reduce:`.
9. **Window chrome**: areas at the top 44 px are drag regions (`app-drag`). Interactive elements inside them need `app-no-drag`. The content header uses `titlebar-inset` to clear the native window controls.

## Check

- Check both themes: switch the theme in the sidebar footer, or take screenshots with Playwright (`page.screenshot`) in light and dark.
- `pnpm lint && pnpm typecheck`, plus an E2E test with role-based locators for user-facing behavior.
- For new color pairs, run the `design:accessibility-review` skill.
