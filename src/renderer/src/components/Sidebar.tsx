import { Button, Dropdown } from '@heroui/react'
import {
  ArrowUpDown,
  Ellipsis,
  Hash,
  Inbox,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { List, ListSort } from '../../../shared/domain'
import { useCreateList, useMoveList, useRenameList, useSetListSort } from '../hooks/queries'
import { useOrderedLists } from '../hooks/useNavigation'
import { neighborIds, type DropSide } from '../lib/reorder'
import { useUiStore } from '../stores/ui'
import { SMART_VIEWS } from '../views'
import { AccentPicker } from './AccentPicker'
import { DeleteListDialog } from './DeleteListDialog'
import { InlineNameInput } from './InlineNameInput'
import { SidebarItem } from './SidebarItem'
import { SortableListItem } from './SortableListItem'
import { ThemeSwitcher } from './ThemeSwitcher'

/** `full`: wide window; `rail`: collapsed to icons; `drawer`: overlay on narrow windows. */
export type SidebarVariant = 'full' | 'rail' | 'drawer'

export function Sidebar({ variant = 'full' }: { variant?: SidebarVariant }): React.JSX.Element {
  const { inbox, userLists, sort } = useOrderedLists()
  const isManual = sort === 'manual'
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
  const { mutate: moveList } = useMoveList()
  const { mutate: setListSort } = useSetListSort()
  const isCreating = useUiStore((state) => state.isCreatingList)
  const setIsCreating = useUiStore((state) => state.setCreatingList)
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<List | null>(null)

  // Naming a new list needs room: leave the rail first.
  useEffect(() => {
    if (isRail && isCreating) setSidebarCollapsed(false)
  }, [isRail, isCreating, setSidebarCollapsed])

  /** Puts `listId` right before or after `anchor` in the shown order. */
  const placeList = (listId: number, anchor: List, side: DropSide): void =>
    moveList({ id: listId, target: neighborIds(userLists, listId, anchor.id, side) })
  const moveStep = (list: List, step: -1 | 1): void => {
    const neighbor = userLists[userLists.indexOf(list) + step]
    if (neighbor) placeList(list.id, neighbor, step === -1 ? 'before' : 'after')
  }
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
          <div className={`flex items-center ${isRail ? 'flex-col' : ''}`}>
            {!isRail && (
              <Dropdown>
                <Button size="sm" variant="ghost" isIconOnly aria-label="Ordenar listas">
                  <ArrowUpDown className="size-4" aria-hidden />
                </Button>
                <Dropdown.Popover placement="bottom end">
                  <Dropdown.Menu
                    aria-label="Ordenar listas"
                    selectionMode="single"
                    selectedKeys={[sort]}
                    onAction={(key) => setListSort(key as ListSort)}
                  >
                    <Dropdown.Item id="manual" textValue="Manual">
                      <Dropdown.ItemIndicator />
                      Manual
                    </Dropdown.Item>
                    <Dropdown.Item id="alpha" textValue="Alfabética">
                      <Dropdown.ItemIndicator />
                      Alfabética
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            )}
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
        </div>

        <nav
          aria-label="Listas"
          className={`flex flex-col gap-0.5 overflow-y-auto pb-2 ${
            isRail ? 'items-center px-1' : 'px-2'
          }`}
        >
          {userLists.map((list, index) =>
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
              <SortableListItem
                key={list.id}
                listId={list.id}
                listName={list.name}
                isSortable={isManual}
                onDrop={(draggedId, side) => placeList(draggedId, list, side)}
                onMoveStep={(step) => moveStep(list, step)}
              >
                <SidebarItem
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
                            if (key === 'up') moveStep(list, -1)
                            if (key === 'down') moveStep(list, 1)
                            if (key === 'delete') setDeleting(list)
                          }}
                          disabledKeys={[
                            ...(index === 0 ? ['up'] : []),
                            ...(index === userLists.length - 1 ? ['down'] : [])
                          ]}
                        >
                          <Dropdown.Item id="rename" textValue="Renomear">
                            Renomear
                          </Dropdown.Item>
                          {isManual && (
                            <Dropdown.Item id="up" textValue="Mover para cima">
                              Mover para cima
                            </Dropdown.Item>
                          )}
                          {isManual && (
                            <Dropdown.Item id="down" textValue="Mover para baixo">
                              Mover para baixo
                            </Dropdown.Item>
                          )}
                          <Dropdown.Item id="delete" textValue="Excluir" variant="danger">
                            Excluir…
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown>
                  }
                />
              </SortableListItem>
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
