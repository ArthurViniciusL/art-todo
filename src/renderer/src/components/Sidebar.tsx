import { Button, Dropdown } from '@heroui/react'
import { Ellipsis, Hash, Inbox, Plus } from 'lucide-react'
import { useState } from 'react'
import type { List } from '../../../shared/domain'
import { useCreateList, useLists, useRenameList } from '../hooks/queries'
import { useUiStore } from '../stores/ui'
import { SMART_VIEWS } from '../views'
import { DeleteListDialog } from './DeleteListDialog'
import { InlineNameInput } from './InlineNameInput'
import { SidebarItem } from './SidebarItem'
import { ThemeSwitcher } from './ThemeSwitcher'

export function Sidebar(): React.JSX.Element {
  const { data: lists = [] } = useLists()
  const selection = useUiStore((state) => state.selection)
  const select = useUiStore((state) => state.select)
  const { mutate: createList } = useCreateList()
  const { mutate: renameList } = useRenameList()
  const isCreating = useUiStore((state) => state.isCreatingList)
  const setIsCreating = useUiStore((state) => state.setCreatingList)
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<List | null>(null)

  const inbox = lists.find((list) => list.isInbox)
  const userLists = lists.filter((list) => !list.isInbox)
  const isListActive = (list: List): boolean =>
    list.isInbox ? selection === null : selection?.kind === 'list' && selection.listId === list.id

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-separator bg-sidebar">
      <div className="app-drag flex h-11 items-center px-4">
        <span className="text-sm font-semibold tracking-tight">Art Todo</span>
      </div>

      <nav aria-label="Visões" className="flex flex-col gap-0.5 px-2 pt-2">
        {inbox && (
          <SidebarItem
            icon={Inbox}
            label={inbox.name}
            isActive={isListActive(inbox)}
            onSelect={() => select(null)}
          />
        )}
        {SMART_VIEWS.map(({ id, label, icon }) => (
          <SidebarItem
            key={id}
            icon={icon}
            label={label}
            isActive={selection?.kind === 'view' && selection.view === id}
            onSelect={() => select({ kind: 'view', view: id })}
          />
        ))}
      </nav>

      <section aria-labelledby="lists-heading" className="mt-6 flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-4 pb-1">
          <h2
            id="lists-heading"
            className="text-xs font-semibold uppercase tracking-wide text-muted"
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

        <nav aria-label="Listas" className="flex flex-col gap-0.5 overflow-y-auto px-2 pb-2">
          {userLists.map((list) =>
            renamingId === list.id ? (
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
          {userLists.length === 0 && !isCreating && (
            <p className="px-2.5 py-1 text-sm text-muted">Nenhuma lista ainda.</p>
          )}
        </nav>
      </section>

      <footer className="flex items-center justify-between border-t border-separator px-3 py-2.5">
        <span className="text-xs text-muted">Tema</span>
        <ThemeSwitcher />
      </footer>

      <DeleteListDialog list={deleting} onClose={() => setDeleting(null)} />
    </aside>
  )
}
