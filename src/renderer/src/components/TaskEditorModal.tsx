import {
  Button,
  Label,
  Modal,
  TextArea,
  TextField,
  Input,
  ToggleButton,
  ToggleButtonGroup
} from '@heroui/react'
import { useEffect, useState } from 'react'
import { TASK_STATUSES, type Task, type TaskStatus } from '../../../shared/domain'
import { useTasksByList, useUpdateTask } from '../hooks/queries'
import { useTaskActions } from '../hooks/useTaskActions'
import { useUiStore } from '../stores/ui'
import { STATUS_META } from '../task-status'

function TaskEditorForm({ task, onClose }: { task: Task; onClose: () => void }): React.JSX.Element {
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes)
  const [status, setStatusDraft] = useState<TaskStatus>(task.status)
  const { mutate: update } = useUpdateTask()
  const { setStatus, removeTask } = useTaskActions()

  const save = (): void => {
    if (!title.trim()) return
    if (title !== task.title || notes !== task.notes) {
      update({ id: task.id, patch: { title, notes } })
    }
    setStatus(task, status)
    onClose()
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          save()
        }
      }}
    >
      <Modal.Header>
        <Modal.Heading>Editar tarefa</Modal.Heading>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4">
        <TextField value={title} onChange={setTitle} isRequired autoFocus>
          <Label>Título</Label>
          <Input />
        </TextField>
        <TextField value={notes} onChange={setNotes}>
          <Label>Notas</Label>
          <TextArea rows={5} placeholder="Detalhes, links, ideias…" />
        </TextField>
        <div className="flex flex-col gap-1.5">
          <span id="status-label" className="text-sm font-medium">
            Status
          </span>
          <ToggleButtonGroup
            aria-labelledby="status-label"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[status]}
            onSelectionChange={(keys) => {
              const [key] = keys
              if (key) setStatusDraft(key as TaskStatus)
            }}
          >
            {TASK_STATUSES.map((option) => {
              const meta = STATUS_META[option]
              return (
                <ToggleButton key={option} id={option}>
                  <meta.icon className={`size-4 ${meta.className}`} aria-hidden />
                  {meta.label}
                </ToggleButton>
              )
            })}
          </ToggleButtonGroup>
        </div>
      </Modal.Body>
      <Modal.Footer className="flex items-center justify-between">
        <Button
          variant="danger-soft"
          onPress={() => {
            removeTask(task)
            onClose()
          }}
        >
          Excluir
        </Button>
        <div className="flex gap-2">
          <Button variant="tertiary" onPress={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isDisabled={!title.trim()}>
            Salvar
          </Button>
        </div>
      </Modal.Footer>
    </form>
  )
}

export function TaskEditorModal({ listId }: { listId: number }): React.JSX.Element {
  const editingTaskId = useUiStore((state) => state.editingTaskId)
  const openTask = useUiStore((state) => state.openTask)
  const { data: tasks = [] } = useTasksByList(listId)
  const task = tasks.find((item) => item.id === editingTaskId)
  const close = (): void => openTask(null)

  // The task can disappear while the modal is open (deleted, list removed).
  useEffect(() => {
    if (editingTaskId !== null && !task) openTask(null)
  }, [editingTaskId, task, openTask])

  return (
    <Modal.Backdrop isOpen={task !== undefined} onOpenChange={(isOpen) => !isOpen && close()}>
      <Modal.Container size="md">
        <Modal.Dialog aria-label="Editar tarefa">
          {task && <TaskEditorForm key={task.id} task={task} onClose={close} />}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
