import { Kbd, Modal } from '@heroui/react'
import {
  Columns3,
  FileDown,
  LayoutGrid,
  List as ListIcon,
  Monitor,
  Moon,
  Plus,
  Search,
  Sun,
  Undo2,
  type LucideIcon
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  Autocomplete,
  Header,
  Input,
  Menu,
  MenuItem,
  MenuSection,
  SearchField,
  useFilter
} from 'react-aria-components'
import type { ViewMode } from '../../../shared/domain'
import type { ThemePreference } from '../../../shared/theme'
import {
  useLists,
  useSearchTasks,
  useSetListViewMode,
  useSetSmartViewMode,
  useSetThemePreference
} from '../hooks/queries'
import { useNavTargets, useStartNewTask } from '../hooks/useNavigation'
import { useUiStore } from '../stores/ui'
import { useUndoStore } from '../stores/undo'
import { STATUS_META } from '../task-status'
import { VIEW_MODE_META } from '../view-modes'

interface Command {
  id: string
  label: string
  icon: LucideIcon
  shortcut?: string
  run: () => void
}

function CommandItem({
  id,
  textValue,
  icon: Icon,
  shortcut,
  onAction,
  children
}: {
  id: string
  textValue: string
  icon: LucideIcon
  shortcut?: string
  onAction: () => void
  children: ReactNode
}): React.JSX.Element {
  return (
    <MenuItem
      id={id}
      textValue={textValue}
      onAction={onAction}
      className="flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-foreground outline-none data-[focused]:bg-default"
    >
      <Icon className="size-4 shrink-0 text-muted" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <Kbd className="text-xs">{shortcut}</Kbd>}
    </MenuItem>
  )
}

function SectionHeader({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <Header className="px-2.5 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted">
      {children}
    </Header>
  )
}

const THEMES: { id: ThemePreference; label: string; icon: LucideIcon }[] = [
  { id: 'light', label: 'Tema claro', icon: Sun },
  { id: 'dark', label: 'Tema escuro', icon: Moon },
  { id: 'system', label: 'Tema do sistema', icon: Monitor }
]

const MODE_ICONS: Record<ViewMode, LucideIcon> = {
  list: ListIcon,
  cards: LayoutGrid,
  columns: Columns3
}

/** Ctrl+K: search tasks and run any app action from one place. */
export function CommandPalette(): React.JSX.Element {
  const isOpen = useUiStore((state) => state.isPaletteOpen)
  const setOpen = useUiStore((state) => state.setPaletteOpen)
  const [query, setQuery] = useState('')

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        setOpen(open)
        if (!open) setQuery('')
      }}
      isDismissable
    >
      <Modal.Container placement="top" size="md">
        <Modal.Dialog aria-label="Paleta de comandos" className="overflow-hidden p-0">
          {isOpen && (
            <PaletteContent
              query={query}
              setQuery={setQuery}
              close={() => {
                setOpen(false)
                setQuery('')
              }}
            />
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}

function PaletteContent({
  query,
  setQuery,
  close
}: {
  query: string
  setQuery: (value: string) => void
  close: () => void
}): React.JSX.Element {
  const { contains } = useFilter({ sensitivity: 'base' })
  const targets = useNavTargets()
  const { data: lists = [] } = useLists()
  const { data: found = [] } = useSearchTasks(query)
  const selection = useUiStore((state) => state.selection)
  const select = useUiStore((state) => state.select)
  const openTask = useUiStore((state) => state.openTask)
  const setCreatingList = useUiStore((state) => state.setCreatingList)
  const setExportOpen = useUiStore((state) => state.setExportOpen)
  const undoLast = useUndoStore((state) => state.undoLast)
  const startNewTask = useStartNewTask()
  const { mutate: setTheme } = useSetThemePreference()
  const { mutate: setListMode } = useSetListViewMode()
  const { mutate: setSmartMode } = useSetSmartViewMode()
  const inbox = lists.find((list) => list.isInbox)
  const listNames = new Map(lists.map((list) => [list.id, list.name]))

  const setMode = (viewMode: ViewMode): void => {
    if (selection?.kind === 'view') setSmartMode({ view: selection.view, viewMode })
    else {
      const id = selection?.kind === 'list' ? selection.listId : inbox?.id
      if (id !== undefined) setListMode({ id, viewMode })
    }
  }

  const sections: { title: string; commands: Command[] }[] = [
    {
      title: 'Ações',
      commands: [
        { id: 'new-task', label: 'Nova tarefa', icon: Plus, shortcut: 'N', run: startNewTask },
        { id: 'new-list', label: 'Nova lista', icon: Plus, run: () => setCreatingList(true) },
        { id: 'undo', label: 'Desfazer', icon: Undo2, shortcut: 'Ctrl+Z', run: () => undoLast() },
        {
          id: 'export',
          label: 'Exportar Markdown',
          icon: FileDown,
          shortcut: 'Ctrl+E',
          run: () => setExportOpen(true)
        }
      ]
    },
    {
      title: 'Ir para',
      commands: targets.map((target, index) => ({
        id: `go-${target.id}`,
        label: target.label,
        icon: target.icon,
        shortcut: index < 9 ? `Ctrl+${index + 1}` : undefined,
        run: () => select(target.selection)
      }))
    },
    {
      title: 'Visualização',
      commands: (['list', 'cards', 'columns'] as const).map((mode) => ({
        id: `mode-${mode}`,
        label: `Modo ${VIEW_MODE_META[mode].label}`,
        icon: MODE_ICONS[mode],
        shortcut: VIEW_MODE_META[mode].shortcut,
        run: () => setMode(mode)
      }))
    },
    {
      title: 'Tema',
      commands: THEMES.map((theme) => ({
        id: `theme-${theme.id}`,
        label: theme.label,
        icon: theme.icon,
        run: () => setTheme(theme.id)
      }))
    }
  ]
    .map((section) => ({
      ...section,
      commands: section.commands.filter((command) => contains(command.label, query))
    }))
    .filter((section) => section.commands.length > 0)

  const run = (action: () => void): void => {
    close()
    action()
  }

  const hasResults = sections.length > 0 || found.length > 0

  return (
    <Autocomplete inputValue={query} onInputChange={setQuery}>
      <SearchField
        aria-label="Buscar tarefas e comandos"
        autoFocus
        // Escape closes the palette instead of only clearing the field.
        onKeyDown={(event) => event.key === 'Escape' && close()}
        className="border-b border-separator"
      >
        <div className="flex h-12 items-center gap-2.5 px-4">
          <Search className="size-4 text-muted" aria-hidden />
          <Input
            placeholder="Buscar tarefas ou digitar um comando…"
            className="h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
          />
          <Kbd className="text-xs">Esc</Kbd>
        </div>
      </SearchField>
      <Menu
        aria-label="Resultados"
        className="max-h-[min(60vh,420px)] overflow-y-auto p-2 outline-none"
        renderEmptyState={() => (
          <p className="px-2.5 py-6 text-center text-sm text-muted">Nada encontrado.</p>
        )}
      >
        {hasResults && found.length > 0 && (
          <MenuSection>
            <SectionHeader>Tarefas</SectionHeader>
            {found.map((task) => (
              <CommandItem
                key={`task-${task.id}`}
                id={`task-${task.id}`}
                textValue={task.title}
                icon={STATUS_META[task.status].icon}
                onAction={() =>
                  run(() => {
                    const list = lists.find((item) => item.id === task.listId)
                    select(list?.isInbox ? null : { kind: 'list', listId: task.listId })
                    openTask(task.id)
                  })
                }
              >
                {task.title}
                <span className="ml-2 text-xs text-muted">{listNames.get(task.listId)}</span>
              </CommandItem>
            ))}
          </MenuSection>
        )}
        {sections.map((section) => (
          <MenuSection key={section.title}>
            <SectionHeader>{section.title}</SectionHeader>
            {section.commands.map((command) => (
              <CommandItem
                key={command.id}
                id={command.id}
                textValue={command.label}
                icon={command.icon}
                shortcut={command.shortcut}
                onAction={() => run(command.run)}
              >
                {command.label}
              </CommandItem>
            ))}
          </MenuSection>
        ))}
      </Menu>
    </Autocomplete>
  )
}
