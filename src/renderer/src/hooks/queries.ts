import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  List,
  ListDeleteMode,
  ListMove,
  ListSort,
  NewTask,
  SmartView,
  Task,
  TaskMove,
  TaskPatch,
  ViewMode
} from '../../../shared/domain'
import { positionBetween } from '../../../shared/ordering'
import type { ThemePreference } from '../../../shared/theme'
import { invoke } from '../lib/api'

export const queryKeys = {
  theme: ['settings', 'theme'] as const,
  accent: ['settings', 'accent'] as const,
  smartViewMode: (view: SmartView) => ['settings', 'viewMode', view] as const,
  listSort: ['settings', 'listSort'] as const,
  updateAutoCheck: ['settings', 'updateAutoCheck'] as const,
  updateState: ['updates', 'state'] as const,
  lists: ['lists'] as const,
  tasks: ['tasks'] as const,
  tasksByList: (listId: number) => ['tasks', 'list', listId] as const,
  tasksDue: (until: string, completedSince: number) =>
    ['tasks', 'due', until, completedSince] as const,
  taskSearch: (query: string) => ['tasks', 'search', query] as const
}

// Settings

export function useThemePreference() {
  return useQuery({ queryKey: queryKeys.theme, queryFn: () => invoke('settings:getTheme') })
}

export function useSetThemePreference() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (preference: ThemePreference) => invoke('settings:setTheme', preference),
    onMutate: (preference) => client.setQueryData(queryKeys.theme, preference)
  })
}

export function useAccent() {
  return useQuery({ queryKey: queryKeys.accent, queryFn: () => invoke('settings:getAccent') })
}

export function useSetAccent() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (hex: string | null) => invoke('settings:setAccent', hex),
    onMutate: (hex) => client.setQueryData(queryKeys.accent, hex)
  })
}

export function useSmartViewMode(view: SmartView) {
  return useQuery({
    queryKey: queryKeys.smartViewMode(view),
    queryFn: () => invoke('settings:getSmartViewMode', view)
  })
}

export function useSetSmartViewMode() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ view, viewMode }: { view: SmartView; viewMode: ViewMode }) =>
      invoke('settings:setSmartViewMode', view, viewMode),
    onMutate: ({ view, viewMode }) => client.setQueryData(queryKeys.smartViewMode(view), viewMode)
  })
}

export function useListSort() {
  return useQuery({ queryKey: queryKeys.listSort, queryFn: () => invoke('settings:getListSort') })
}

export function useSetListSort() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (sort: ListSort) => invoke('settings:setListSort', sort),
    onMutate: (sort) => client.setQueryData(queryKeys.listSort, sort)
  })
}

export function useUpdateAutoCheck() {
  return useQuery({
    queryKey: queryKeys.updateAutoCheck,
    queryFn: () => invoke('settings:getUpdateAutoCheck')
  })
}

export function useSetUpdateAutoCheck() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) => invoke('settings:setUpdateAutoCheck', enabled),
    onMutate: (enabled) => client.setQueryData(queryKeys.updateAutoCheck, enabled)
  })
}

// Lists

export function useLists() {
  return useQuery({ queryKey: queryKeys.lists, queryFn: () => invoke('lists:getAll') })
}

function useInvalidateLists() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: queryKeys.lists })
}

export function useCreateList() {
  const onSuccess = useInvalidateLists()
  return useMutation({ mutationFn: (name?: string) => invoke('lists:create', name), onSuccess })
}

export function useRenameList() {
  const onSuccess = useInvalidateLists()
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => invoke('lists:rename', id, name),
    onSuccess
  })
}

export function useMoveList() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, target }: { id: number; target: ListMove }) =>
      invoke('lists:move', id, target),
    // Reorder at once so repeated Alt+arrows start from the new order; the refetch settles it.
    onMutate: ({ id, target }) =>
      client.setQueryData<List[]>(queryKeys.lists, (lists = []) => {
        const byId = (listId: number | null): List | null =>
          lists.find((list) => list.id === listId) ?? null
        const moved = byId(id)
        if (!moved) return lists
        const position = positionBetween(byId(target.prevId), byId(target.nextId), {
          fallback: () => moved.position,
          renumber: () => {},
          reload: (listId) => byId(listId)!
        })
        return lists
          .map((list) => (list.id === id ? { ...list, position } : list))
          .sort((a, b) => a.position - b.position)
      }),
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.lists })
  })
}

export function useSetListViewMode() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, viewMode }: { id: number; viewMode: ViewMode }) =>
      invoke('lists:setViewMode', id, viewMode),
    // Switch instantly; the mutation only persists the choice.
    onMutate: ({ id, viewMode }) =>
      client.setQueryData<List[]>(queryKeys.lists, (lists) =>
        lists?.map((list) => (list.id === id ? { ...list, viewMode } : list))
      )
  })
}

export function useRemoveList() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, mode }: { id: number; mode: ListDeleteMode }) =>
      invoke('lists:remove', id, mode),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.lists })
      void client.invalidateQueries({ queryKey: queryKeys.tasks })
    }
  })
}

// Tasks

export function useTasksByList(listId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.tasksByList(listId ?? 0),
    queryFn: () => invoke('tasks:getByList', listId as number),
    enabled: listId !== undefined
  })
}

/** Due tasks for the smart views; see TasksRepository.getDue. */
export function useDueTasks(until: string, completedSince: number) {
  return useQuery({
    queryKey: queryKeys.tasksDue(until, completedSince),
    queryFn: () => invoke('tasks:getDue', until, completedSince)
  })
}

/** Tasks can show up in several views, so every task mutation refreshes all task queries. */
function useTaskMutation<A>(mutationFn: (args: A) => Promise<Task | void>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.tasks })
  })
}

export function useCreateTask() {
  return useTaskMutation((input: NewTask) => invoke('tasks:create', input))
}

export function useUpdateTask() {
  return useTaskMutation(({ id, patch }: { id: number; patch: TaskPatch }) =>
    invoke('tasks:update', id, patch)
  )
}

export function useMoveTask() {
  return useTaskMutation(({ id, target }: { id: number; target: TaskMove }) =>
    invoke('tasks:move', id, target)
  )
}

export function useSearchTasks(query: string) {
  return useQuery({
    queryKey: queryKeys.taskSearch(query),
    queryFn: () => invoke('tasks:search', query),
    enabled: query.trim().length > 0,
    placeholderData: (previous) => previous
  })
}

export function useRemoveTask() {
  return useTaskMutation((id: number) => invoke('tasks:remove', id))
}

export function useRestoreTask() {
  return useTaskMutation((task: Task) => invoke('tasks:restore', task))
}
