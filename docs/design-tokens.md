# Design tokens

Tokens live in `src/renderer/src/assets/main.css` and override the HeroUI v3 default theme. Components use them through Tailwind classes (`bg-sidebar`, `text-accent-text`, `ring-focus`) and never use raw hex values.

| Token                 | Light             | Dark              | Use                                                     |
| --------------------- | ----------------- | ----------------- | ------------------------------------------------------- |
| `--accent`            | `#FFCA39`         | `#FFCA39`         | Fills: done status, primary button, selection           |
| `--accent-foreground` | `#1A1A1A`         | `#1A1A1A`         | Text and icons on the accent fill (11.4:1)              |
| `--accent-text`       | `#8A6500`         | `#FFCA39`         | Accent as text, icons and thin strokes (5.1:1 / 11.9:1) |
| `--focus`             | = `--accent-text` | = `--accent-text` | Focus ring                                              |
| `--background`        | `#FAFAF9`         | `#161616`         | Window and content area                                 |
| `--foreground`        | `#1A1A1A`         | `#EDEDED`         | Body text (16.7:1 / 15.5:1)                             |
| `--muted`             | `#6B6B6B`         | `#9A9A9A`         | Secondary text (5.1:1 / 6.4:1)                          |
| `--sidebar`           | `#F2F1EE`         | `#1B1B1B`         | Sidebar background                                      |
| `--sidebar-active`    | `#E6E4DF`         | `#282828`         | Active and hover sidebar item                           |
| `--priority-high`     | `#B42318`         | `#F97066`         | High priority marker (6.6:1 / 6.5:1)                    |

Rules:

- Never put `#FFCA39` text or thin icons on a light surface (1.5:1). Use `--accent-text`.
- Titlebar overlay colors in `src/shared/theme.ts` must match `--background` and `--foreground`.
- Font: Open Sans Variable, bundled through `@fontsource-variable/open-sans`.
