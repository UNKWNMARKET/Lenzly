import { useRef } from 'react'
import { useLocation } from 'wouter'

// Swipeable tabs in order — Upload is intentionally excluded
const SWIPE_TABS = ['/', '/explore', '/find', '/profile']

const THRESHOLD = 60   // min horizontal px to count as a swipe
const RATIO     = 1.8  // horizontal must be this much more than vertical

export function useSwipeNav() {
  const [location, navigate] = useLocation()
  const startX = useRef(0)
  const startY = useRef(0)

  const currentIdx = SWIPE_TABS.indexOf(location)

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (currentIdx === -1) return   // not a swipeable tab, do nothing
    const dx = e.changedTouches[0].clientX - startX.current
    const dy = e.changedTouches[0].clientY - startY.current
    if (Math.abs(dx) < THRESHOLD) return
    if (Math.abs(dy) * RATIO > Math.abs(dx)) return   // more vertical than horizontal

    if (dx < 0 && currentIdx < SWIPE_TABS.length - 1) {
      // swipe left → next tab
      navigate(SWIPE_TABS[currentIdx + 1])
    } else if (dx > 0 && currentIdx > 0) {
      // swipe right → previous tab
      navigate(SWIPE_TABS[currentIdx - 1])
    }
  }

  return { onTouchStart, onTouchEnd }
}
