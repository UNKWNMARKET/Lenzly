import { useState, useRef, useEffect } from 'react'
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

// Total slots in the nav row (4 tabs + 1 create button)
const TOTAL_SLOTS = 5

export default function BottomNav() {
  const [location, navigate] = useLocation()
  const [open, setOpen] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  // Hide nav when software keyboard is open (iOS WKWebView resize event)
  useEffect(() => {
    const onResize = () => {
      // If the visual viewport is significantly shorter than the window, keyboard is up
      const vv = (window as any).visualViewport
      if (vv) {
        setKeyboardVisible(vv.height < window.innerHeight * 0.75)
      }
    }
    const vv = (window as any).visualViewport
    vv?.addEventListener('resize', onResize)
    return () => vv?.removeEventListener('resize', onResize)
  }, [])

  const navRowRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startPct: number } | null>(null)
  const [dragPct, setDragPct] = useState<number | null>(null) // 0-1 across tabs
  const [dragging, setDragging] = useState(false)

  const activeIdx = tabs.findIndex(({ path }) =>
    path === '/' ? location === '/' : location.startsWith(path)
  )

  // Each slot takes 1/TOTAL_SLOTS of the nav width.
  // Pill center aligns with slot center.
  // pillLeft (as % of nav width) = (activeIdx + 0.5) / TOTAL_SLOTS - pillHalfWidth
  // We use inline style with calc so it's always pixel-perfect.

  const slotPct = 100 / TOTAL_SLOTS            // % width of one slot
  const pillWidthPct = slotPct * 0.85          // pill is 85% of a slot width
  const activeCenterPct = (activeIdx + 0.5) * slotPct  // center of active slot in %

  // During drag, override with dragPct
  const pillCenterPct = dragging && dragPct !== null ? dragPct : activeCenterPct
  const pillLeftPct = pillCenterPct - pillWidthPct / 2

  // ── Drag handlers ────────────────────────────────────────────────────────
  const onPillTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    setDragging(true)
    dragRef.current = { startX: e.touches[0].clientX, startPct: pillCenterPct }
    haptics.light?.()
  }

  const onPillTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current || !navRowRef.current) return
    e.stopPropagation()
    const navW = navRowRef.current.getBoundingClientRect().width
    const dx = e.touches[0].clientX - dragRef.current.startX
    const dPct = (dx / navW) * 100
    // Clamp between first and last tab center
    const minPct = 0.5 * slotPct
    const maxPct = (tabs.length - 0.5) * slotPct
    setDragPct(Math.max(minPct, Math.min(maxPct, dragRef.current.startPct + dPct)))
  }

  const onPillTouchEnd = () => {
    if (!dragRef.current) return
    setDragging(false)
    // Snap to nearest tab
    const cur = dragPct ?? pillCenterPct
    let nearest = 0
    let minDist = Infinity
    tabs.forEach((_, i) => {
      const center = (i + 0.5) * slotPct
      const d = Math.abs(center - cur)
      if (d < minDist) { minDist = d; nearest = i }
    })
    setDragPct(null)
    dragRef.current = null
    haptics.light?.()
    navigate(tabs[nearest].path)
  }

  const handleOption = (path: string) => { setOpen(false); navigate(path) }

  return (
    <>
      {/* Create sheet */}
      {open && (
        <div className="fixed inset-0 z-[65] flex items-end" onClick={() => setOpen(false)}>
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

      <nav
        className="app-bottom-nav md:hidden fixed bottom-0 left-1/2 w-full max-w-[430px] z-50"
        style={{
          transform: keyboardVisible ? 'translateX(-50%) translateY(110%)' : 'translateX(-50%)',
          transition: 'transform 0.2s ease',
        }}
      >
        <div className="mx-4 mb-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div
            ref={navRowRef}
            className="relative flex items-center px-2 py-2 bg-[#0e0e0e]/95 backdrop-blur-2xl border border-white/8 rounded-3xl shadow-2xl shadow-black/60"
          >
            {/* Gold outline pill — absolutely positioned, purely CSS-calculated */}
            {activeIdx >= 0 && (
              <div
                className="absolute top-1.5 bottom-1.5 rounded-2xl pointer-events-auto z-10"
                style={{
                  left: `${pillLeftPct}%`,
                  width: `${pillWidthPct}%`,
                  background: 'transparent',
                  border: '1.5px solid rgba(201,168,76,0.7)',
                  boxShadow: '0 0 12px rgba(201,168,76,0.15), inset 0 0 6px rgba(201,168,76,0.05)',
                  transition: dragging ? 'none' : 'left 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                onTouchStart={onPillTouchStart}
                onTouchMove={onPillTouchMove}
                onTouchEnd={onPillTouchEnd}
              />
            )}

            {/* Tab buttons — equal flex so slots are perfectly even */}
            {tabs.map(({ path, icon: Icon, label }, i) => {
              const active = path === '/' ? location === '/' : location.startsWith(path)
              return (
                <Link key={path} href={path} className="flex-1">
                  <button
                    className="relative z-20 w-full flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-200 active:scale-95"
                    onClick={() => haptics.light?.()}
                  >
                    <Icon
                      size={21}
                      strokeWidth={active ? 2.2 : 1.6}
                      className={cn('transition-all duration-200', active ? 'text-gold' : 'text-white/35')}
                    />
                    <span className={cn(
                      'text-[9px] font-semibold tracking-wider uppercase leading-[1.15] transition-colors duration-200',
                      active ? 'text-gold/80' : 'text-white/25'
                    )}>
                      {label}
                    </span>
                  </button>
                </Link>
              )
            })}

            {/* Create button — same flex-1 slot as tabs */}
            <div className="flex-1 flex justify-center">
              <button
                onClick={() => { haptics.medium(); setOpen(o => !o) }}
                className="relative z-20 flex flex-col items-center py-1"
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
        </div>
      </nav>
    </>
  )
}
