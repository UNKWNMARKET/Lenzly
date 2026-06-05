import { useState, useRef, useLayoutEffect } from 'react'
import { Home, Compass, MapPin, User, Plus, Camera, ImagePlus, X } from 'lucide-react'
import { useLocation, Link } from 'wouter'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'

const tabs = [
  { path: '/', icon: Home, label: 'Feed' },
  { path: '/explore', icon: Compass, label: 'Explore' },
  { path: '/find', icon: MapPin, label: 'Find' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const [location, navigate] = useLocation()
  const [open, setOpen] = useState(false)

  // Glass pill drag state
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const navRowRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; pillX: number; tabCenters: number[] } | null>(null)
  const [pillX, setPillX] = useState<number | null>(null)
  const [pillW, setPillW] = useState(0)
  const [dragging, setDragging] = useState(false)

  const activeIdx = tabs.findIndex(({ path }) =>
    path === '/' ? location === '/' : location.startsWith(path)
  )

  // Measure tab centers relative to the nav row container
  useLayoutEffect(() => {
    const measure = () => {
      const containerLeft = navRowRef.current?.getBoundingClientRect().left ?? 0
      const centers = tabRefs.current.map(el => {
        if (!el) return 0
        const r = el.getBoundingClientRect()
        return (r.left - containerLeft) + r.width / 2
      })
      const tabEl = tabRefs.current[0]
      const w = tabEl ? tabEl.getBoundingClientRect().width + 16 : 72
      setPillW(w)
      if (activeIdx >= 0) setPillX(centers[activeIdx] - w / 2)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [activeIdx, location])

  const getTabCenters = () => {
    const containerLeft = navRowRef.current?.getBoundingClientRect().left ?? 0
    return tabRefs.current.map(el => {
      const r = el?.getBoundingClientRect()
      return r ? (r.left - containerLeft) + r.width / 2 : 0
    })
  }

  const onPillTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    const centers = getTabCenters()
    dragRef.current = { startX: e.touches[0].clientX, pillX: pillX ?? 0, tabCenters: centers }
    setDragging(true)
    haptics.light?.()
  }

  const onPillTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current) return
    e.stopPropagation()
    const dx = e.touches[0].clientX - dragRef.current.startX
    const raw = dragRef.current.pillX + dx
    // Clamp between first and last tab center
    const centers = dragRef.current.tabCenters
    const min = centers[0] - pillW / 2
    const max = centers[centers.length - 1] - pillW / 2
    setPillX(Math.max(min, Math.min(max, raw)))
  }

  const onPillTouchEnd = (e: React.TouchEvent) => {
    if (!dragRef.current) return
    e.stopPropagation()
    setDragging(false)
    // Snap to nearest tab
    const pillCenter = (pillX ?? 0) + pillW / 2
    const centers = dragRef.current.tabCenters
    let nearest = 0
    let minDist = Infinity
    centers.forEach((cx, i) => {
      const d = Math.abs(cx - pillCenter)
      if (d < minDist) { minDist = d; nearest = i }
    })
    dragRef.current = null
    haptics.light?.()
    navigate(tabs[nearest].path)
  }

  const handleOption = (path: string) => { setOpen(false); navigate(path) }

  return (
    <>
      {/* Create sheet */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-[430px] mx-auto px-4 pb-6 animate-slide-up"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px) + 90px, 106px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#141414] border border-white/10 rounded-3xl overflow-hidden mb-3">
              <button
                onClick={() => handleOption('/upload')}
                className="w-full flex items-center gap-4 px-5 py-5 border-b border-white/8 active:bg-white/5 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/25 flex items-center justify-center flex-shrink-0">
                  <ImagePlus size={22} className="text-gold" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-[15px]">Post a Photo</p>
                  <p className="text-white/35 text-xs mt-0.5">Share a photo to your profile feed</p>
                </div>
              </button>
              <button
                onClick={() => handleOption('/spot')}
                className="w-full flex items-center gap-4 px-5 py-5 active:bg-white/5 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
                  <Camera size={22} className="text-amber-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-[15px]">Add a Spot</p>
                  <p className="text-white/35 text-xs mt-0.5">Share your location for 24 hours</p>
                </div>
              </button>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-full py-4 bg-[#141414] border border-white/10 rounded-2xl text-white/50 text-sm font-semibold active:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <nav className="app-bottom-nav md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
        <div className="mx-4 mb-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div ref={navRowRef} className="relative flex items-center justify-around px-2 py-2 bg-[#0e0e0e]/95 backdrop-blur-2xl border border-white/8 rounded-3xl shadow-2xl shadow-black/60">

            {/* Floating glass pill */}
            {pillX !== null && (
              <div
                ref={pillRef}
                className="absolute top-1.5 bottom-1.5 rounded-2xl pointer-events-auto z-10"
                style={{
                  left: pillX,
                  width: pillW,
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(20px) saturate(1.8)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 8px rgba(0,0,0,0.2)',
                  transition: dragging ? 'none' : 'left 0.28s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                onTouchStart={onPillTouchStart}
                onTouchMove={onPillTouchMove}
                onTouchEnd={onPillTouchEnd}
              />
            )}

            {/* Tab buttons */}
            {tabs.map(({ path, icon: Icon, label }, i) => {
              const active = path === '/' ? location === '/' : location.startsWith(path)
              return (
                <Link key={path} href={path}>
                  <button
                    ref={el => { tabRefs.current[i] = el }}
                    className="relative z-20 flex flex-col items-center gap-1 py-2 px-2.5 rounded-2xl transition-all duration-200 active:scale-95"
                    onClick={() => haptics.light?.()}
                  >
                    <Icon
                      size={21}
                      strokeWidth={active ? 2.2 : 1.6}
                      className={cn('transition-all duration-200', active ? 'text-white' : 'text-white/35')}
                    />
                    <span className={cn(
                      'text-[9px] font-semibold tracking-wider uppercase leading-[1.15] text-center transition-colors duration-200',
                      active ? 'text-white/80' : 'text-white/25'
                    )}>
                      {label}
                    </span>
                  </button>
                </Link>
              )
            })}

            {/* Create button */}
            <button
              onClick={() => { haptics.medium(); setOpen(o => !o) }}
              className="relative z-20 flex flex-col items-center py-1 px-3 group"
            >
              <div className={cn(
                'w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-gold/30 transition-all duration-200',
                open ? 'scale-90 rotate-45' : 'active:scale-95'
              )}>
                {open
                  ? <X size={22} strokeWidth={2.5} className="text-lenz-bg" />
                  : <Plus size={24} strokeWidth={2.5} className="text-lenz-bg" />
                }
              </div>
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}
