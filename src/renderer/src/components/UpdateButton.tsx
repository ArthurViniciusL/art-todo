import { Button, Tooltip } from '@heroui/react'
import { updateAction, useUpdateState } from '../hooks/useUpdate'

/** Top-bar update control: check, download or install, depending on the state. */
export function UpdateButton(): React.JSX.Element {
  const state = useUpdateState()
  const { label, icon: Icon, run, percent } = updateAction(state)
  const isBusy = !run
  const hasNews = state.status === 'available' || state.status === 'ready'

  return (
    <Tooltip delay={300}>
      <Button
        size="sm"
        variant="ghost"
        isIconOnly
        aria-label={label}
        isDisabled={isBusy}
        className="app-no-drag relative"
        onPress={run}
      >
        {percent !== undefined ? (
          <span className="text-[10px] font-semibold tabular-nums" aria-hidden>
            {percent}%
          </span>
        ) : (
          <Icon
            className={`size-4 ${isBusy ? 'animate-spin' : ''} ${hasNews ? 'text-accent-text' : ''}`}
            aria-hidden
          />
        )}
        {hasNews && (
          <span aria-hidden className="absolute right-1 top-1 size-1.5 rounded-full bg-accent" />
        )}
      </Button>
      <Tooltip.Content placement="bottom">{label}</Tooltip.Content>
    </Tooltip>
  )
}

/** Sidebar footer call to action while a new version is on its way. */
export function UpdateBanner(): React.JSX.Element | null {
  const state = useUpdateState()
  if (state.status !== 'available' && state.status !== 'downloading' && state.status !== 'ready') {
    return null
  }
  const { label, icon: Icon, run, percent } = updateAction(state)
  return (
    <div className="px-2 pb-2">
      <Button
        size="sm"
        variant="primary"
        fullWidth
        isDisabled={!run}
        onPress={run}
        aria-label={label}
        className="relative justify-start overflow-hidden"
      >
        {percent !== undefined && (
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 bg-accent-foreground/15"
            style={{ width: `${percent}%` }}
          />
        )}
        <Icon className="size-4" aria-hidden />
        <span className="truncate">
          {state.status === 'downloading'
            ? `Baixando… ${percent}%`
            : `Atualizar para ${state.version}`}
        </span>
      </Button>
    </div>
  )
}
