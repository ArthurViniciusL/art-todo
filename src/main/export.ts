import { app, BrowserWindow, clipboard, dialog } from 'electron'
import { readFile, stat, writeFile } from 'fs/promises'
import { basename, join } from 'path'
import { IMPORT_MAX_BYTES } from '../shared/domain'
import { markdownFileName } from '../shared/markdown'

const parentWindow = (): BrowserWindow | undefined =>
  BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]

/** Asks where to save and writes the file. Returns false when the user cancels. */
export async function saveMarkdown(title: string, content: string): Promise<boolean> {
  const window = parentWindow()
  const options = {
    title: 'Exportar Markdown',
    defaultPath: join(app.getPath('documents'), markdownFileName(title)),
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  }
  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) return false
  await writeFile(result.filePath, content, 'utf8')
  return true
}

export function copyText(text: string): void {
  clipboard.writeText(text)
}

/** Asks for a Markdown file and reads it. Returns null when the user cancels. */
export async function pickMarkdown(): Promise<{ fileName: string; content: string } | null> {
  const window = parentWindow()
  const options: Electron.OpenDialogOptions = {
    title: 'Importar tarefas',
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
  }
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options)
  const [filePath] = result.filePaths
  if (result.canceled || !filePath) return null
  if (!/\.(md|markdown)$/i.test(filePath)) throw new Error('Escolha um arquivo .md')
  if ((await stat(filePath)).size > IMPORT_MAX_BYTES) throw new Error('O arquivo passa de 1 MB')
  return { fileName: basename(filePath), content: await readFile(filePath, 'utf8') }
}
