import { useRef } from 'react'
import { useLocation } from 'wouter'

// Swipeable tabs in order — Upload is intentionally excluded
const SWIPE_TABS = ['/', '/explore', '/find', '/profile']

const THRESHOLD          = 60   // min horizontal px to count as a swipe
const THRESHOLD_MAP      = 120  // much higher threshold when on the map page
const THRESHOLD_EXPLORE  = 110  // high threshold on explore — lots of horizontal scrolling
const RATIO              = 2.5  // horizontal must be this much more than vertical

// Returns true if the touch started inside a Leaflet map or any map container
function isTouchOnMap(e: React.TouchEvent): boolean {
  const target = e.target as HTMLElement
  return !!(
    target.closest('.leaflet-container') ||
    target.closest('.leaflet-pane') ||
    target.closest('[class*="leaflet"]') ||
    target.closest('[class*="map"]')
  )
}

export function useSwipeNav() {
  const [location, navigate] = useLocation()
  const startX = useRef(0)
  const startY = useRef(0)
  const blockedByMap = useRef(false)

  const currentIdx = SWIPE_TABS.indexOf(location)
  const isMapPage = location === '/find'
  const isExplorePage = location === '/explore'

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    // Block swipe nav for the entire gesture if it starts on a map element
    blockedByMap.current = isMapPage && isTouchOnMap(e)
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (currentIdx === -1) return
    if (blockedByMap.current) { blockedByMap.current = false; return }

    const dx = e.changedTouches[0].clientX - startX.current
    const dy = e.changedTouches[0].clientY - startY.current
    const threshold = isMapPage ? THRESHOLD_MAP : isExplorePage ? THRESHOLD_EXPLORE : THRESHOLD

    if (Math.abs(dx) < threshold) return
    if (Math.abs(dy) * RATIO > Math.abs(dx)) return

    if (dx < 0 && currentIdx < SWIPE_TABS.length - 1) {
      navigate(SWIPE_TABS[currentIdx + 1])
    } else if (dx > 0 && currentIdx > 0) {
      navigate(SWIPE_TABS[currentIdx - 1])
    }
  }

  return { onTouchStart, onTouchEnd }
}
