import { useState } from 'react'
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

  const handleOption = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <>
      {/* Create sheet */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-[430px] mx-auto px-4 pb-6 animate-slide-up"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px) + 90px, 106px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Options */}
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
          <div className="flex items-center justify-around px-2 py-2 bg-[#0e0e0e]/95 backdrop-blur-2xl border border-white/8 rounded-3xl shadow-2xl shadow-black/60">
            {tabs.map(({ path, icon: Icon, label }) => {
              const active = path === '/' ? location === '/' : location.startsWith(path)
              return (
                <Link key={path} href={path}>
                  <button className={cn(
                    'flex flex-col items-center gap-1 py-2 px-2.5 rounded-2xl transition-all duration-200 group active:scale-95',
                    active ? 'bg-gold/10' : 'hover:bg-white/5'
                  )}>
                    <Icon
                      size={21}
                      strokeWidth={active ? 2.2 : 1.6}
                      className={cn('transition-all duration-200', active ? 'text-gold' : 'text-white/35 group-hover:text-white/55')}
                    />
                    <span className={cn(
                      'text-[9px] font-semibold tracking-wider uppercase leading-[1.15] text-center max-w-[54px] min-h-[22px] flex items-center justify-center transition-colors duration-200',
                      active ? 'text-gold' : 'text-white/25 group-hover:text-white/40'
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
              className="flex flex-col items-center py-1 px-3 group"
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
