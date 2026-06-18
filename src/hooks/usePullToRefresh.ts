import { useRef, useState, useCallback } from 'react'

interface Options {
  onRefresh: () => Promise<void> | void
  threshold?: number   // px to pull before triggering (default 72)
  resistance?: number  // pull-distance multiplier, 0–1 (default 0.4)
}

export function usePullToRefresh({ onRefresh, threshold = 72, resistance = 0.4 }: Options) {
  const startY   = useRef(0)
  const [pullY,  setPullY]       = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Only activate when the scroll container is at the very top
    const el = scrollRef.current
    if (el && el.scrollTop > 0) return
    startY.current = e.touches[0].clientY
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (refreshing) return
    const el = scrollRef.current
    if (el && el.scrollTop > 0) return
    const delta = e.touches[0].clientY - startY.current
    if (delta <= 0) return
    // Apply resistance so it feels springy
    setPullY(Math.min(delta * resistance, threshold * 1.5))
  }, [refreshing, resistance, threshold])

  const onTouchEnd = useCallback(async () => {
    if (pullY >= threshold && !refreshing) {
      setRefreshing(true)
      setPullY(0)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    } else {
      setPullY(0)
    }
  }, [pullY, threshold, refreshing, onRefresh])

  return { scrollRef, pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd }
}
