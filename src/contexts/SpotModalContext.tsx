import { createContext, useContext, useState, useCallback } from 'react'
import type { PhotoSpot } from '@/data/mockData'

type SpotModalContextType = {
  openSpot: (spot: PhotoSpot) => void
  closeSpot: () => void
  currentSpot: PhotoSpot | null
}

const SpotModalContext = createContext<SpotModalContextType>({
  openSpot: () => {},
  closeSpot: () => {},
  currentSpot: null,
})

export function useSpotModal() {
  return useContext(SpotModalContext)
}

export function SpotModalProvider({ children }: { children: React.ReactNode }) {
  const [currentSpot, setCurrentSpot] = useState<PhotoSpot | null>(null)
  const openSpot = useCallback((spot: PhotoSpot) => setCurrentSpot(spot), [])
  const closeSpot = useCallback(() => setCurrentSpot(null), [])
  return (
    <SpotModalContext.Provider value={{ openSpot, closeSpot, currentSpot }}>
      {children}
    </SpotModalContext.Provider>
  )
}
