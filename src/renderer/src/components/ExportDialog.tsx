import { Button, Label, Modal, Switch, toast } from '@heroui/react'
import { Copy, FileDown } from 'lucide-react'
import { useState } from 'react'
import { TASK_STATUSES, type Task, type ViewMode } from '../../../shared/domain'
import { toMarkdown, type MarkdownSection } from '../../../shared/markdown'
import { useCompactLayout } from '../hooks/useCompactLayout'
import { invoke } from '../lib/api'
import { useUiStore } from '../stores/ui'
import { STATUS_META } from '../task-status'

export interface ExportSource {
  title: string
  mode: ViewMode
  /** Open tasks in the view's order, already grouped (one untitled group for lists). */
  groups: MarkdownSection[]
  /** Done tasks the view knows about, newest first. */
  done: Task[]
}

function buildSections(
  { groups, done }: ExportSource,
  includeDone: boolean,
  byStatus: boolean
): MarkdownSection[] {
  if (byStatus) {
    const open = groups.flatMap((group) => group.tasks)
    return TASK_STATUSES.filter((status) => includeDone || status !== 'done').map((status) => ({
      heading: STATUS_META[status].label,
      tasks: status === 'done' ? done : open.filter((task) => task.status === status)
    }))
  }
  return includeDone ? [...groups, { heading: 'Concluídas', tasks: done }] : groups
}

function OptionSwitch({
  label,
  isSelected,
  onChange
}: {
  label: string
  isSelected: boolean
  onChange: (value: boolean) => void
}): React.JSX.Element {
  return (
    <Switch isSelected={isSelected} onChange={onChange} size="sm">
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Label className="text-sm">{label}</Label>
      </Switch.Content>
    </Switch>
  )
}

function ExportForm({
  source,
  onClose
}: {
  source: ExportSource
  onClose: () => void
}): React.JSX.Element {
  const [includeDone, setIncludeDone] = useState(true)
  const [byStatus, setByStatus] = useState(source.mode === 'columns')
  const markdown = toMarkdown({
    title: source.title,
    sections: buildSections(source, includeDone, byStatus)
  })

  // These calls bypass TanStack mutations, so report failures here.
  const attempt = async (action: () => Promise<void>): Promise<void> => {
    try {
      await action()
    } catch (error) {
      toast.danger('Não foi possível exportar', {
        description: error instanceof Error ? error.message : String(error)
      })
    }
  }

  const copy = (): Promise<void> =>
    attempt(async () => {
      await invoke('export:copy', markdown)
      toast.success('Markdown copiado')
      onClose()
    })

  const save = (): Promise<void> =>
    attempt(async () => {
      if (await invoke('export:saveMarkdown', source.title, markdown)) {
        toast.success('Arquivo salvo')
        onClose()
      }
    })

  return (
    <>
      <Modal.Header>
        <Modal.Heading>Exportar “{source.title}”</Modal.Heading>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <OptionSwitch
            label="Incluir concluídas"
            isSelected={includeDone}
            onChange={setIncludeDone}
          />
          {source.mode === 'columns' && (
            <OptionSwitch label="Agrupar por status" isSelected={byStatus} onChange={setByStatus} />
          )}
        </div>
        <pre
          aria-label="Prévia do Markdown"
          tabIndex={0}
          className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-default p-3 font-mono text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          {markdown}
        </pre>
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-2">
        <Button variant="tertiary" onPress={onClose}>
          Cancelar
        </Button>
        <Button variant="secondary" onPress={() => void copy()}>
          <Copy className="size-4" aria-hidden />
          Copiar
        </Button>
        <Button variant="primary" onPress={() => void save()}>
          <FileDown className="size-4" aria-hidden />
          Salvar .md
        </Button>
      </Modal.Footer>
    </>
  )
}

/** Markdown export of the current list or smart view (Ctrl+E, header button, palette). */
export function ExportDialog({ source }: { source: ExportSource }): React.JSX.Element {
  const isOpen = useUiStore((state) => state.isExportOpen)
  const setOpen = useUiStore((state) => state.setExportOpen)

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
      <Modal.Container size="lg">
        <Modal.Dialog aria-label="Exportar Markdown">
          {isOpen && <ExportForm source={source} onClose={() => setOpen(false)} />}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}

export function ExportButton(): React.JSX.Element | null {
  const setOpen = useUiStore((state) => state.setExportOpen)
  // No room in a phone-sized header; Ctrl+E and the palette still open it.
  if (useCompactLayout()) return null
  return (
    <Button
      size="sm"
      variant="ghost"
      isIconOnly
      aria-label="Exportar Markdown (Ctrl+E)"
      className="app-no-drag"
      onPress={() => setOpen(true)}
    >
      <FileDown className="size-4" aria-hidden />
    </Button>
  )
}
