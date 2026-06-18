import { useRef } from 'react'
import { useLocation } from 'wouter'

// Swipeable tabs in order — Upload is intentionally excluded
const SWIPE_TABS = ['/', '/explore', '/find', '/profile']

const THRESHOLD          = 60   // min horizontal px to count as a swipe
const THRESHOLD_MAP      = 999  // effectively disabled on map page — use tabs to navigate
const THRESHOLD_EXPLORE  = 150  // very high on explore — full of horizontal carousels
const RATIO              = 2.5  // horizontal must be this much more than vertical

// Returns true if the touch started inside a Leaflet map or any map container
function isTouchOnMap(e: React.TouchEvent): boolean {
  const target = e.target as HTMLElement
  return !!(
    target.closest('[data-map-container]') ||
    target.closest('.leaflet-container') ||
    target.closest('.leaflet-pane') ||
    target.closest('[class*="leaflet"]')
  )
}

// Returns true if the touch started inside an element that can scroll
// horizontally (carousels, chip rows, story bars). Page-nav must yield to
// these so the user can actually scroll through the content.
function isTouchOnHScroll(e: React.TouchEvent): boolean {
  let el: HTMLElement | null = e.target as HTMLElement
  while (el && el !== document.body) {
    const ox = window.getComputedStyle(el).overflowX
    if ((ox === 'auto' || ox === 'scroll') && el.scrollWidth > el.clientWidth + 4) {
      return true
    }
    el = el.parentElement
  }
  return false
}

export function useSwipeNav() {
  const [location, navigate] = useLocation()
  const startX = useRef(0)
  const startY = useRef(0)
  const blocked = useRef(false)

  const currentIdx = SWIPE_TABS.indexOf(location)
  const isMapPage = location === '/find'
  const isExplorePage = location === '/explore'

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    // Block page-nav for the whole gesture if it starts on a map element or
    // inside any horizontally scrollable container (carousels, chip rows).
    blocked.current = (isMapPage && isTouchOnMap(e)) || isTouchOnHScroll(e)
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (currentIdx === -1) return
    if (blocked.current) { blocked.current = false; return }

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
