import { useRouterState } from '@tanstack/react-router'

export function RouteTransitionIndicator() {
  const isPending = useRouterState({ select: (state) => state.status === 'pending' })
  if (!isPending) return null

  return <div className="route-transition-indicator" role="status" aria-label="Loading page"><span /></div>
}
