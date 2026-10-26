# Design tokens

Static tokens live in `src/renderer/src/assets/main.css` and override the HeroUI v3 default theme. Accent and status colors are computed at runtime by `themeTokens()` in `src/shared/palette.ts` and set on `<html>` by `useTheme`. Components use all of them through Tailwind classes (`bg-sidebar`, `text-accent-text`, `text-status-todo`, `ring-focus`) and never use raw hex values.

## Accent (user choice)

The default is HeroUI's accent (`#0485F7`). The user can pick a preset or type any `#rrggbb` in the sidebar footer (_Cor de destaque_); it is stored in the settings table (`accent`, null = default). For each theme the app derives:

| Token                      | Rule                                                                                                 | Use                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `--accent`                 | The chosen color; shaded to 3:1 only if it nearly matches the page (under 1.3:1, e.g. black on dark) | Fills: primary button, selection, checked switch                |
| `--accent-foreground`      | `#1A1A1A` or white, whichever reads better on the fill                                               | Text and icons on the fill                                      |
| `--accent-text`            | The chosen color shaded until 4.5:1 on the page                                                      | Accent as text, icons and thin strokes                          |
| `--accent-soft-foreground` | = `--accent-text`                                                                                    | Text on soft accent fills (secondary buttons, selected toggles) |
| `--focus`, `--link`        | = `--accent-text`                                                                                    | Focus ring, links                                               |

## Task status (HeroUI semantic colors)

| Status  | HeroUI color | Tokens                                                                                                                          |
| ------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| A fazer | danger       | `--status-todo` (icon, label text, ≥ 4.5:1)                                                                                     |
| Fazendo | warning      | `--status-doing` (icon, label text, ≥ 4.5:1)                                                                                    |
| Feito   | success      | `--status-done` (label text, ≥ 4.5:1), `--status-done-fill` (filled check), `--status-done-foreground` (check mark on the fill) |

Card labels use the status color at 12–15 % as background with the status text color.

## Static tokens

| Token              | Light     | Dark      | Use                                                    |
| ------------------ | --------- | --------- | ------------------------------------------------------ |
| `--background`     | `#FAFAF9` | `#161616` | Window and content area                                |
| `--foreground`     | `#1A1A1A` | `#EDEDED` | Body text (16.7:1 / 15.5:1)                            |
| `--muted`          | `#6B6B6B` | `#9A9A9A` | Secondary text (5.1:1 / 6.4:1)                         |
| `--sidebar`        | `#F2F1EE` | `#1B1B1B` | Sidebar background                                     |
| `--sidebar-active` | `#E6E4DF` | `#282828` | Active and hover sidebar item                          |
| `--priority-high`  | `#B42318` | `#F97066` | High priority marker and overdue dates (6.6:1 / 6.5:1) |
| `--priority-high-foreground` | `#FFFFFF` | `#1A1A1A` | Text on the critical priority pill (6.6:1 / 7.0:1) |

Rules:

- `--background` must match `BACKGROUND` in `src/shared/palette.ts` and the titlebar colors in `src/shared/theme.ts`.
- `src/shared/color.test.ts` checks every derived text token reaches 4.5:1 for several accents in both themes.
- Font: Open Sans Variable, bundled through `@fontsource-variable/open-sans`.
