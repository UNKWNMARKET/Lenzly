import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [visible, setVisible] = useState(!navigator.onLine)

  useEffect(() => {
    const onOffline = () => { setOffline(true); setVisible(true) }
    const onOnline = () => {
      setOffline(false)
      // Keep the "back online" state visible briefly then hide
      setTimeout(() => setVisible(false), 2500)
    }
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  if (!visible) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold transition-colors duration-300 safe-top ${
      offline
        ? 'bg-red-500/90 text-white backdrop-blur-sm'
        : 'bg-green-600/90 text-white backdrop-blur-sm'
    }`}>
      {offline ? (
        <>
          <WifiOff size={13} />
          <span>No internet connection</span>
        </>
      ) : (
        <span>Back online</span>
      )}
    </div>
  )
}
