import { useState } from 'react'
import { Home, Compass, MapPin, User, PlusSquare, Image, X } from 'lucide-react'
import { useLocation, Link } from 'wouter'
import { cn } from '@/lib/utils'

const tabs = [
  { path: '/', icon: Home, label: 'Feed' },
  { path: '/explore', icon: Compass, label: 'Explore' },
  { path: '/upload', icon: PlusSquare, label: '', isUpload: true },
  { path: '/find', icon: MapPin, label: 'Find' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const [location, navigate] = useLocation()
  const [showUploadSheet, setShowUploadSheet] = useState(false)

  return (
    <>
      <nav className="app-bottom-nav md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
        {/* Floating pill container */}
        <div className="mx-4 mb-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex items-center justify-around px-2 py-2 bg-[#0e0e0e]/95 backdrop-blur-2xl border border-white/8 rounded-3xl shadow-2xl shadow-black/60">
            {tabs.map(({ path, icon: Icon, label, isUpload }) => {
              const active = path === '/'
                ? location === '/'
                : location.startsWith(path)

              if (isUpload) {
                return (
                  <button key={path} onClick={() => setShowUploadSheet(true)} className="flex flex-col items-center py-1 px-3 group">
                    <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-gold/30 active:scale-95 transition-transform">
                      <Icon size={22} strokeWidth={2.2} className="text-lenz-bg" />
                    </div>
                  </button>
                )
              }

              return (
                <Link key={path} href={path}>
                  <button className={cn(
                    'flex flex-col items-center gap-1 py-2 px-2.5 rounded-2xl transition-all duration-200 group active:scale-95',
                    active ? 'bg-gold/10' : 'hover:bg-white/5'
                  )}>
                    <Icon
                      size={21}
                      strokeWidth={active ? 2.2 : 1.6}
                      className={cn(
                        'transition-all duration-200',
                        active ? 'text-gold' : 'text-white/35 group-hover:text-white/55'
                      )}
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
          </div>
        </div>
      </nav>

      {/* Upload action sheet */}
      {showUploadSheet && (
        <div
          className="fixed inset-0 z-[80] flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => setShowUploadSheet(false)}
        >
          <div
            className="w-full max-w-[430px] md:max-w-[600px] mx-auto pb-6 safe-bottom px-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-lenz-card border border-lenz-border rounded-2xl overflow-hidden mb-3">
              <button
                onClick={() => { setShowUploadSheet(false); navigate('/upload') }}
                className="flex items-center gap-4 w-full px-5 py-4 hover:bg-white/5 active:bg-white/10 transition-colors border-b border-lenz-border"
              >
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                  <Image size={18} className="text-gold" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Share a Photo</p>
                  <p className="text-xs text-white/40 mt-0.5">Post a photo to your feed</p>
                </div>
              </button>
              <button
                onClick={() => { setShowUploadSheet(false); navigate('/post-spot') }}
                className="flex items-center gap-4 w-full px-5 py-4 hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-gold" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Share a Spot</p>
                  <p className="text-xs text-white/40 mt-0.5">Add a photo location to the map</p>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowUploadSheet(false)}
              className="w-full py-4 rounded-2xl bg-lenz-card border border-lenz-border text-white/70 font-semibold text-sm active:scale-95 transition-transform"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
