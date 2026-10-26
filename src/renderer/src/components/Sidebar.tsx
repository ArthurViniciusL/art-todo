import { Button, Dropdown } from '@heroui/react'
import { Ellipsis, Hash, Inbox, PanelLeftClose, PanelLeftOpen, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { List } from '../../../shared/domain'
import { useCreateList, useLists, useRenameList } from '../hooks/queries'
import { useUiStore } from '../stores/ui'
import { SMART_VIEWS } from '../views'
import { AccentPicker } from './AccentPicker'
import { DeleteListDialog } from './DeleteListDialog'
import { InlineNameInput } from './InlineNameInput'
import { SidebarItem } from './SidebarItem'
import { ThemeSwitcher } from './ThemeSwitcher'

/** `full`: wide window; `rail`: collapsed to icons; `drawer`: overlay on narrow windows. */
export type SidebarVariant = 'full' | 'rail' | 'drawer'

export function Sidebar({ variant = 'full' }: { variant?: SidebarVariant }): React.JSX.Element {
  const { data: lists = [] } = useLists()
  const selection = useUiStore((state) => state.selection)
  const selectView = useUiStore((state) => state.select)
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed)
  const setDrawerOpen = useUiStore((state) => state.setDrawerOpen)
  const isRail = variant === 'rail'
  // In the drawer, picking a destination also closes it.
  const select: typeof selectView = (target) => {
    selectView(target)
    if (variant === 'drawer') setDrawerOpen(false)
  }
  const { mutate: createList } = useCreateList()
  const { mutate: renameList } = useRenameList()
  const isCreating = useUiStore((state) => state.isCreatingList)
  const setIsCreating = useUiStore((state) => state.setCreatingList)
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<List | null>(null)

  // Naming a new list needs room: leave the rail first.
  useEffect(() => {
    if (isRail && isCreating) setSidebarCollapsed(false)
  }, [isRail, isCreating, setSidebarCollapsed])

  const inbox = lists.find((list) => list.isInbox)
  const userLists = lists.filter((list) => !list.isInbox)
  const isListActive = (list: List): boolean =>
    list.isInbox ? selection === null : selection?.kind === 'list' && selection.listId === list.id

  return (
    <aside
      aria-label="Barra lateral"
      className={`flex shrink-0 flex-col border-r border-separator bg-sidebar ${
        isRail ? 'w-14 items-center' : 'w-60'
      } ${variant === 'drawer' ? 'h-full shadow-2xl' : ''}`}
    >
      <div
        className={`app-drag flex h-11 w-full shrink-0 items-center ${
          isRail ? 'justify-center' : 'justify-between pl-4 pr-2'
        }`}
      >
        {!isRail && <span className="text-sm font-semibold tracking-tight">Art Todo</span>}
        <Button
          size="sm"
          variant="ghost"
          isIconOnly
          className="app-no-drag"
          aria-label={
            isRail
              ? 'Expandir barra lateral'
              : variant === 'drawer'
                ? 'Fechar barra lateral'
                : 'Recolher barra lateral'
          }
          onPress={() =>
            variant === 'drawer' ? setDrawerOpen(false) : setSidebarCollapsed(!isRail)
          }
        >
          {isRail ? (
            <PanelLeftOpen className="size-4" aria-hidden />
          ) : variant === 'drawer' ? (
            <X className="size-4" aria-hidden />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden />
          )}
        </Button>
      </div>

      <nav
        aria-label="Visões"
        className={`flex flex-col gap-0.5 pt-2 ${isRail ? 'items-center px-1' : 'px-2'}`}
      >
        {inbox && (
          <SidebarItem
            icon={Inbox}
            label={inbox.name}
            isActive={isListActive(inbox)}
            onSelect={() => select(null)}
            isRail={isRail}
          />
        )}
        {SMART_VIEWS.map(({ id, label, icon }) => (
          <SidebarItem
            key={id}
            icon={icon}
            label={label}
            isActive={selection?.kind === 'view' && selection.view === id}
            onSelect={() => select({ kind: 'view', view: id })}
            isRail={isRail}
          />
        ))}
      </nav>

      <section
        aria-labelledby="lists-heading"
        className={`mt-6 flex min-h-0 w-full flex-1 flex-col ${isRail ? 'items-center' : ''}`}
      >
        <div
          className={`flex items-center pb-1 ${isRail ? 'justify-center' : 'justify-between px-4'}`}
        >
          <h2
            id="lists-heading"
            className={
              isRail ? 'sr-only' : 'text-xs font-semibold uppercase tracking-wide text-muted'
            }
          >
            Listas
          </h2>
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            aria-label="Nova lista"
            onPress={() => setIsCreating(true)}
          >
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>

        <nav
          aria-label="Listas"
          className={`flex flex-col gap-0.5 overflow-y-auto pb-2 ${
            isRail ? 'items-center px-1' : 'px-2'
          }`}
        >
          {userLists.map((list) =>
            isRail ? (
              <SidebarItem
                key={list.id}
                icon={Hash}
                label={list.name}
                isActive={isListActive(list)}
                onSelect={() => select({ kind: 'list', listId: list.id })}
                isRail
                railText={list.name.trim().charAt(0).toUpperCase() || '#'}
              />
            ) : renamingId === list.id ? (
              <InlineNameInput
                key={list.id}
                label="Nome da lista"
                initialValue={list.name}
                onSubmit={(name) => {
                  if (name.trim() && name.trim() !== list.name) renameList({ id: list.id, name })
                  setRenamingId(null)
                }}
                onCancel={() => setRenamingId(null)}
              />
            ) : (
              <SidebarItem
                key={list.id}
                icon={Hash}
                label={list.name}
                isActive={isListActive(list)}
                onSelect={() => select({ kind: 'list', listId: list.id })}
                onDoubleClick={() => setRenamingId(list.id)}
                trailing={
                  <Dropdown>
                    <Button
                      size="sm"
                      variant="ghost"
                      isIconOnly
                      aria-label={`Opções da lista ${list.name}`}
                      className="size-6 min-w-6"
                    >
                      <Ellipsis className="size-4" aria-hidden />
                    </Button>
                    <Dropdown.Popover placement="bottom end">
                      <Dropdown.Menu
                        aria-label={`Opções da lista ${list.name}`}
                        onAction={(key) => {
                          if (key === 'rename') setRenamingId(list.id)
                          if (key === 'delete') setDeleting(list)
                        }}
                      >
                        <Dropdown.Item id="rename" textValue="Renomear">
                          Renomear
                        </Dropdown.Item>
                        <Dropdown.Item id="delete" textValue="Excluir" variant="danger">
                          Excluir…
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown>
                }
              />
            )
          )}
          {isCreating && (
            <InlineNameInput
              label="Nome da nova lista"
              placeholder="Nome da lista"
              cancelEmptyOnBlur
              onSubmit={(name) => {
                setIsCreating(false)
                createList(name, {
                  onSuccess: (list) => select({ kind: 'list', listId: list.id })
                })
              }}
              onCancel={() => setIsCreating(false)}
            />
          )}
          {userLists.length === 0 && !isCreating && !isRail && (
            <p className="px-2.5 py-1 text-sm text-muted">Nenhuma lista ainda.</p>
          )}
        </nav>
      </section>

      <footer
        className={`flex w-full border-t border-separator py-2.5 ${
          isRail ? 'flex-col items-center gap-2' : 'items-center justify-between px-3'
        }`}
      >
        {!isRail && <span className="text-xs text-muted">Tema</span>}
        <div className={`flex items-center gap-1 ${isRail ? 'flex-col' : ''}`}>
          <AccentPicker />
          <ThemeSwitcher orientation={isRail ? 'vertical' : 'horizontal'} />
        </div>
      </footer>

      <DeleteListDialog list={deleting} onClose={() => setDeleting(null)} />
    </aside>
  )
}
