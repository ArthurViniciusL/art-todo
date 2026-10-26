import { app, BrowserWindow, clipboard, dialog } from 'electron'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { markdownFileName } from '../shared/markdown'

/** Asks where to save and writes the file. Returns false when the user cancels. */
export async function saveMarkdown(title: string, content: string): Promise<boolean> {
  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
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
