import { useEffect, useRef } from 'react'

// Attach the returned ref to a sentinel element at the bottom of a list.
// `onLoadMore` fires when the sentinel scrolls into view, as long as there is
// more to load and a load isn't already in flight.
export function useInfiniteScroll(
  onLoadMore: () => void,
  { hasMore, loading }: { hasMore: boolean; loading: boolean },
) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  // Keep the latest callback without re-creating the observer each render
  const cb = useRef(onLoadMore)
  cb.current = onLoadMore

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) cb.current()
      },
      { rootMargin: '400px' }, // start loading before it's fully visible
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading])

  return sentinelRef
}
