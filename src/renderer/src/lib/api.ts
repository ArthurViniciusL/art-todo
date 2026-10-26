import type { IpcChannel, IpcContract, IpcEvent, IpcEvents } from '../../../shared/ipc'

/** Typed call into the main process. */
export function invoke<C extends IpcChannel>(
  channel: C,
  ...args: Parameters<IpcContract[C]>
): Promise<ReturnType<IpcContract[C]>> {
  return window.api.invoke(channel, ...args)
}

/** Typed subscription to a main-process event. Returns the unsubscribe function. */
export function onEvent<E extends IpcEvent>(
  event: E,
  listener: (...args: Parameters<IpcEvents[E]>) => void
): () => void {
  return window.api.on(event, listener)
}
