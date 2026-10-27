# Art Todo

A calm, local and offline todo list for the Linux desktop. Built with Electron, React, TypeScript and HeroUI. Your data stays in a SQLite file on your machine.

The interface is in Brazilian Portuguese.

## Features

- **Lists**: a fixed Inbox (_Entrada_) plus your own lists. A list created without a name is named after its creation time (`dd/mm/yy - hh:mm:ss`).
- **Three states per task**: _A fazer_, _Fazendo_, _Feito_. A finished task stays in place for a moment with _Desfazer_, then moves to _Concluídas_.
- **Due date and time, priority** (none, low, medium, high) and notes.
- **Smart views**: _Hoje_ (overdue + today) and _Próximos_ (next 7 days by day, then later).
- **Three view modes** saved per list and per smart view: _Lista_, _Cards_ and _Colunas_ (board by status).
- **Drag and drop** to reorder and to move cards between columns, with mouse or keyboard.
- **Command palette** to search tasks (title and notes) and run any action.
- **Undo** for create, status change, move and delete.
- **Markdown export** (GFM checklists) of the current list or view, to a `.md` file or the clipboard.
- **Light, dark or system theme**, with a custom accent color.
- **Collapsible sidebar** and a layout that works down to a phone-sized window (sidebar as a drawer below 640 px).

## Keyboard shortcuts

| Keys                        | Action                                         |
| --------------------------- | ---------------------------------------------- |
| `Ctrl+K`                    | Command palette                                |
| `N`                         | New task                                       |
| `Ctrl+1` … `Ctrl+9`         | Go to Entrada, Hoje, Próximos, then your lists |
| `Ctrl+Shift+1/2/3`          | Lista / Cards / Colunas                        |
| `Ctrl+E`                    | Export Markdown                                |
| `Ctrl+Z`                    | Undo                                           |
| `↑` `↓` / `J` `K`           | Move between tasks                             |
| `Space`                     | Mark done (or undo done)                       |
| `S`                         | Cycle status                                   |
| `T`                         | Schedule for today                             |
| `Enter`                     | Rename inline                                  |
| `Ctrl+Enter` / double click | Open the edit modal (Ctrl+Enter also saves it) |
| `Delete`                    | Delete (with undo)                             |

## Install

Download `art-todo_<version>_amd64.deb` from the [releases](https://github.com/ArthurViniciusL/art-todo/releases), then:

```bash
sudo apt install ./art-todo_1.1.1_amd64.deb
```

Data lives in `~/.config/art-todo/art-todo.db`.

## Development

```bash
pnpm install
pnpm dev
```

Checks:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e
```

Build the package into `dist/`:

```bash
pnpm build:linux
```

The roadmap and product spec are in [docs/plan.md](docs/plan.md), architecture decisions in [docs/adr/](docs/adr/), and design tokens in [docs/design-tokens.md](docs/design-tokens.md).

## License

MIT
