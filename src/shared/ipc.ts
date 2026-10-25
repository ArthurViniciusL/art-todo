import type {
  List,
  ListDeleteMode,
  NewTask,
  SmartView,
  Task,
  TaskMove,
  TaskPatch,
  ViewMode
} from './domain'
import type { ThemePreference } from './theme'

/**
 * Every IPC channel with its argument and return types.
 * The main process implements each one in src/main/ipc.ts.
 */
export interface IpcContract {
  'settings:getTheme': () => ThemePreference
  'settings:setTheme': (preference: ThemePreference) => void
  'settings:getSmartViewMode': (view: SmartView) => ViewMode
  'settings:setSmartViewMode': (view: SmartView, viewMode: ViewMode) => void

  'lists:getAll': () => List[]
  'lists:create': (name?: string) => List
  'lists:rename': (id: number, name: string) => List
  'lists:setViewMode': (id: number, viewMode: ViewMode) => List
  'lists:remove': (id: number, mode: ListDeleteMode) => void

  'tasks:getByList': (listId: number) => Task[]
  'tasks:getDue': (until: string, completedSince: number) => Task[]
  'tasks:create': (input: NewTask) => Task
  'tasks:update': (id: number, patch: TaskPatch) => Task
  'tasks:move': (id: number, target: TaskMove) => Task
  'tasks:search': (query: string) => Task[]
  'tasks:remove': (id: number) => Task
  'tasks:restore': (task: Task) => Task

  /** Opens a save dialog for `title`.md; false when cancelled. */
  'export:saveMarkdown': (title: string, content: string) => boolean
  'export:copy': (text: string) => void
}

export type IpcChannel = keyof IpcContract

/** Runtime list of channels; the preload refuses anything else. */
export const IPC_CHANNELS = [
  'settings:getTheme',
  'settings:setTheme',
  'settings:getSmartViewMode',
  'settings:setSmartViewMode',
  'lists:getAll',
  'lists:create',
  'lists:rename',
  'lists:setViewMode',
  'lists:remove',
  'tasks:getByList',
  'tasks:getDue',
  'tasks:create',
  'tasks:update',
  'tasks:move',
  'tasks:search',
  'tasks:remove',
  'tasks:restore',
  'export:saveMarkdown',
  'export:copy'
] as const satisfies readonly IpcChannel[]

// Compile error if a channel is in the contract but missing from IPC_CHANNELS.
type MissingChannels = Exclude<IpcChannel, (typeof IPC_CHANNELS)[number]>
const channelsAreComplete: MissingChannels extends never ? true : MissingChannels = true
void channelsAreComplete

export interface IpcApi {
  invoke<C extends IpcChannel>(
    channel: C,
    ...args: Parameters<IpcContract[C]>
  ): Promise<ReturnType<IpcContract[C]>>
}
