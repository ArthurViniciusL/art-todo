import {
  Button,
  DateField,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
  TimeField,
  ToggleButton,
  ToggleButtonGroup
} from '@heroui/react'
import { parseDate, parseTime, type CalendarDate, type Time } from '@internationalized/date'
import { useEffect, useState } from 'react'
import { addDays, toIsoDate } from '../../../shared/dates'
import {
  PRIORITIES,
  TASK_STATUSES,
  type Priority,
  type Task,
  type TaskStatus
} from '../../../shared/domain'
import { useLists, useUpdateTask } from '../hooks/queries'
import { useTaskActions } from '../hooks/useTaskActions'
import { PRIORITY_META, priorityMark } from '../priority'
import { useUiStore } from '../stores/ui'
import { STATUS_META } from '../task-status'

const toTimeString = (time: Time): string =>
  `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`

function TaskEditorForm({ task, onClose }: { task: Task; onClose: () => void }): React.JSX.Element {
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes)
  const [status, setStatusDraft] = useState<TaskStatus>(task.status)
  const [priority, setPriority] = useState<Priority>(task.priority)
  const [listId, setListId] = useState(task.listId)
  const [dueDate, setDueDate] = useState<CalendarDate | null>(
    task.dueDate ? parseDate(task.dueDate) : null
  )
  const [dueTime, setDueTime] = useState<Time | null>(task.dueTime ? parseTime(task.dueTime) : null)
  const { mutate: update } = useUpdateTask()
  const { setStatus, removeTask } = useTaskActions()
  const { data: lists = [] } = useLists()

  const save = (): void => {
    if (!title.trim()) return
    const date = dueDate?.toString() ?? null
    const time = date && dueTime ? toTimeString(dueTime) : null
    update({ id: task.id, patch: { title, notes, priority, dueDate: date, dueTime: time, listId } })
    setStatus(task, status)
    onClose()
  }

  const today = toIsoDate(new Date())
  const setDay = (iso: string | null): void => {
    setDueDate(iso ? parseDate(iso) : null)
    if (!iso) setDueTime(null)
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
          <TextArea rows={4} placeholder="Detalhes, links, ideias…" />
        </TextField>

        <div className="flex flex-wrap items-end gap-3">
          <DateField value={dueDate} onChange={(value) => setDay(value?.toString() ?? null)}>
            <Label>Data</Label>
            <DateField.Group>
              <DateField.Input>
                {(segment) => <DateField.Segment segment={segment} />}
              </DateField.Input>
            </DateField.Group>
          </DateField>
          <TimeField value={dueTime} onChange={setDueTime} isDisabled={!dueDate} hourCycle={24}>
            <Label>Hora</Label>
            <TimeField.Group>
              <TimeField.Input>
                {(segment) => <TimeField.Segment segment={segment} />}
              </TimeField.Input>
            </TimeField.Group>
          </TimeField>
          <div className="flex gap-1">
            <Button size="sm" variant="tertiary" onPress={() => setDay(today)}>
              Hoje
            </Button>
            <Button size="sm" variant="tertiary" onPress={() => setDay(addDays(today, 1))}>
              Amanhã
            </Button>
            <Button size="sm" variant="ghost" onPress={() => setDay(null)} isDisabled={!dueDate}>
              Sem data
            </Button>
          </div>
        </div>

        <Select
          value={listId}
          onChange={(key) => key !== null && setListId(Number(key))}
          className="max-w-xs"
        >
          <Label>Lista</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {lists.map((list) => (
                <ListBox.Item key={list.id} id={list.id} textValue={list.name}>
                  {list.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <div className="flex flex-col gap-1.5">
          <span id="priority-label" className="text-sm font-medium">
            Prioridade
          </span>
          <ToggleButtonGroup
            aria-labelledby="priority-label"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[String(priority)]}
            onSelectionChange={(keys) => {
              const [key] = keys
              if (key !== undefined) setPriority(Number(key) as Priority)
            }}
          >
            {PRIORITIES.map((option) => (
              <ToggleButton key={option} id={String(option)}>
                {option > 0 && (
                  <span aria-hidden className={`font-bold ${PRIORITY_META[option].className}`}>
                    {priorityMark(option)}
                  </span>
                )}
                {PRIORITY_META[option].label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>

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

/** Edit modal for the task in `editingTaskId`, looked up among the tasks the view shows. */
export function TaskEditorModal({
  tasks,
  isLoaded
}: {
  tasks: Task[]
  /** False while the view's tasks are still loading, so a just-requested task is not dropped. */
  isLoaded: boolean
}): React.JSX.Element {
  const editingTaskId = useUiStore((state) => state.editingTaskId)
  const openTask = useUiStore((state) => state.openTask)
  const task = tasks.find((item) => item.id === editingTaskId)
  const close = (): void => openTask(null)

  // The task can disappear while the modal is open (deleted, list removed).
  useEffect(() => {
    if (isLoaded && editingTaskId !== null && !task) openTask(null)
  }, [isLoaded, editingTaskId, task, openTask])

  return (
    <Modal.Backdrop isOpen={task !== undefined} onOpenChange={(isOpen) => !isOpen && close()}>
      <Modal.Container size="lg">
        <Modal.Dialog aria-label="Editar tarefa">
          {task && <TaskEditorForm key={task.id} task={task} onClose={close} />}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
