import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'

const MAX_VISIBLE_MS = 900

export function RouteTransitionIndicator() {
  const isPending = useRouterState({ select: (state) => state.status === 'pending' })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isPending) {
      setVisible(false)
      return
    }

    setVisible(true)
    const timeout = window.setTimeout(() => setVisible(false), MAX_VISIBLE_MS)
    return () => window.clearTimeout(timeout)
  }, [isPending])

  if (!isPending || !visible) return null
  return <div className="route-transition-indicator" role="status" aria-label="Loading page"><span /></div>
}
