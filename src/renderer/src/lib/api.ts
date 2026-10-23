import type { IpcChannel, IpcContract } from '../../../shared/ipc'

/** Typed call into the main process. */
export function invoke<C extends IpcChannel>(
  channel: C,
  ...args: Parameters<IpcContract[C]>
): Promise<ReturnType<IpcContract[C]>> {
  return window.api.invoke(channel, ...args)
}
