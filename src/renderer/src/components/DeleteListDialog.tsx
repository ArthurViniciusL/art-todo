import { AlertDialog, Button } from '@heroui/react'
import type { List } from '../../../shared/domain'
import { useRemoveList, useTasksByList } from '../hooks/queries'
import { useUiStore } from '../stores/ui'

interface DeleteListDialogProps {
  list: List | null
  onClose: () => void
}

export function DeleteListDialog({ list, onClose }: DeleteListDialogProps): React.JSX.Element {
  const { data: tasks = [] } = useTasksByList(list?.id)
  const { mutate: removeList } = useRemoveList()
  const selection = useUiStore((state) => state.selection)
  const select = useUiStore((state) => state.select)
  const taskCount = tasks.length

  const remove = (mode: 'delete-tasks' | 'move-to-inbox'): void => {
    if (!list) return
    removeList({ id: list.id, mode })
    if (selection?.kind === 'list' && selection.listId === list.id) select(null)
    onClose()
  }

  return (
    <AlertDialog.Backdrop isOpen={list !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialog.Container>
        <AlertDialog.Dialog>
          <AlertDialog.Header>
            <AlertDialog.Heading>Excluir “{list?.name}”?</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p className="text-sm text-muted">
              {taskCount === 0
                ? 'A lista está vazia.'
                : taskCount === 1
                  ? 'A lista tem 1 tarefa. Você pode apagá-la ou movê-la para a Entrada.'
                  : `A lista tem ${taskCount} tarefas. Você pode apagá-las ou movê-las para a Entrada.`}
            </p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button variant="tertiary" slot="close">
              Cancelar
            </Button>
            {taskCount > 0 && (
              <Button variant="secondary" onPress={() => remove('move-to-inbox')}>
                Mover para Entrada
              </Button>
            )}
            <Button variant="danger" onPress={() => remove('delete-tasks')}>
              {taskCount > 0 ? 'Apagar tudo' : 'Excluir'}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  )
}
