import { Button, Link, Modal, toast } from '@heroui/react'
import { Copy, FileUp } from 'lucide-react'
import { useState } from 'react'
import { IMPORT_MAX_TASKS, TASK_STATUSES, type List } from '../../../shared/domain'
import { parseMarkdownTasks, type MarkdownImport } from '../../../shared/markdown'
import { useImportTasks, useTasksByList } from '../hooks/queries'
import { AI_IMPORT_TEMPLATE } from '../import-template'
import { invoke } from '../lib/api'
import { errorMessage } from '../lib/query-client'
import { STATUS_META } from '../task-status'

interface Props {
  /** Target list; null keeps the dialog closed. */
  list: List | null
  onClose: () => void
}

interface PickedFile extends MarkdownImport {
  fileName: string
}

function Preview({ file, listId }: { file: PickedFile; listId: number }): React.JSX.Element {
  const { data: existing = [] } = useTasksByList(listId)
  const titles = new Set(existing.map((task) => task.title.trim().toLowerCase()))
  const duplicates = file.tasks.filter((task) => titles.has(task.title.toLowerCase())).length
  const tooMany = file.tasks.length > IMPORT_MAX_TASKS

  return (
    <div
      role="status"
      className="flex flex-col gap-1 rounded-lg border border-border bg-default p-3 text-sm"
    >
      <p className="font-medium text-foreground">{file.fileName}</p>
      <p className="text-foreground">
        {file.tasks.length} {file.tasks.length === 1 ? 'tarefa' : 'tarefas'}
        {file.tasks.length > 0 &&
          ` (${TASK_STATUSES.map(
            (status) =>
              `${file.tasks.filter((task) => task.status === status).length} ${STATUS_META[status].label.toLowerCase()}`
          ).join(', ')})`}
      </p>
      {file.ignoredLines > 0 && (
        <p className="text-muted">
          {file.ignoredLines} {file.ignoredLines === 1 ? 'linha ignorada' : 'linhas ignoradas'}
        </p>
      )}
      {duplicates > 0 && (
        <p className="text-muted">
          {duplicates} {duplicates === 1 ? 'título já existe' : 'títulos já existem'} na lista
        </p>
      )}
      {file.tasks.length === 0 && (
        <p className="text-danger">Nenhuma tarefa encontrada no arquivo.</p>
      )}
      {tooMany && (
        <p className="text-danger">O limite é {IMPORT_MAX_TASKS} tarefas por importação.</p>
      )}
    </div>
  )
}

function TemplateDialog({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}): React.JSX.Element {
  const copy = async (): Promise<void> => {
    try {
      await invoke('export:copy', AI_IMPORT_TEMPLATE)
      toast.success('Template copiado')
    } catch (error) {
      toast.danger('Não foi possível copiar', { description: errorMessage(error) })
    }
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container size="lg">
        <Modal.Dialog aria-label="Template para IA">
          <Modal.Header>
            <Modal.Heading>Template para IA</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Cole este texto em uma IA, descreva suas tarefas no final e importe o arquivo .md que
              ela gerar.
            </p>
            <pre
              aria-label="Template"
              tabIndex={0}
              className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-default p-3 font-mono text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {AI_IMPORT_TEMPLATE}
            </pre>
          </Modal.Body>
          <Modal.Footer className="flex justify-end gap-2">
            <Button variant="tertiary" onPress={onClose}>
              Voltar
            </Button>
            <Button variant="primary" onPress={() => void copy()}>
              <Copy className="size-4" aria-hidden />
              Copiar
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}

/** Imports tasks from a Markdown file into one list (list "⋯" menu). */
export function ImportDialog({ list, onClose }: Props): React.JSX.Element {
  const [file, setFile] = useState<PickedFile | null>(null)
  const [isTemplateOpen, setTemplateOpen] = useState(false)
  const { mutate: importTasks, isPending } = useImportTasks()

  const close = (): void => {
    setFile(null)
    setTemplateOpen(false)
    onClose()
  }

  const pick = async (): Promise<void> => {
    try {
      const picked = await invoke('import:pickMarkdown')
      if (picked) setFile({ fileName: picked.fileName, ...parseMarkdownTasks(picked.content) })
    } catch (error) {
      toast.danger('Não foi possível ler o arquivo', { description: errorMessage(error) })
    }
  }

  const confirm = (): void => {
    if (!list || !file) return
    importTasks(
      { listId: list.id, tasks: file.tasks },
      {
        onSuccess: (created) => {
          toast.success(
            `${created.length} ${created.length === 1 ? 'tarefa importada' : 'tarefas importadas'}`
          )
          close()
        }
      }
    )
  }

  const canImport =
    !!file && file.tasks.length > 0 && file.tasks.length <= IMPORT_MAX_TASKS && !isPending

  return (
    <>
      <Modal.Backdrop isOpen={!!list && !isTemplateOpen} onOpenChange={(open) => !open && close()}>
        <Modal.Container>
          <Modal.Dialog aria-label="Importar tarefas">
            <Modal.Header className="justify-center">
              <Modal.Heading className="text-center text-xl">Importar tarefas</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col items-center gap-8 py-4 text-center">
              <p className="max-w-sm text-sm text-muted">
                Escolha um arquivo .md com uma tarefa por linha. As tarefas entram no fim da lista “
                {list?.name}”.
              </p>
              <Button variant="outline" size="lg" className="px-8" onPress={() => void pick()}>
                <FileUp className="size-4" aria-hidden />
                {file ? 'Selecionar outro arquivo' : 'Selecionar arquivo'}
              </Button>
              {file && list && (
                <div className="w-full text-left">
                  <Preview file={file} listId={list.id} />
                </div>
              )}
              <Link className="text-sm text-muted underline" onPress={() => setTemplateOpen(true)}>
                Copiar template para IA
              </Link>
            </Modal.Body>
            {file && (
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="tertiary" onPress={close}>
                  Cancelar
                </Button>
                <Button variant="primary" isDisabled={!canImport} onPress={confirm}>
                  Importar
                </Button>
              </Modal.Footer>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      <TemplateDialog isOpen={isTemplateOpen} onClose={() => setTemplateOpen(false)} />
    </>
  )
}
