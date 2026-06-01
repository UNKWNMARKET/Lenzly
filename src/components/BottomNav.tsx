import { Home, Compass, MapPin, User, PlusSquare } from 'lucide-react'
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
  const [location] = useLocation()

  return (
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
                <Link key={path} href={path}>
                  <button className="flex flex-col items-center py-1 px-3 group">
                    <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-gold/30 active:scale-95 transition-transform">
                      <Icon size={22} strokeWidth={2.2} className="text-lenz-bg" />
                    </div>
                  </button>
                </Link>
              )
            }

            return (
              <Link key={path} href={path}>
                <button className={cn(
                  'flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all duration-200 group active:scale-95',
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
                    'text-[9px] font-semibold tracking-widest uppercase transition-colors duration-200',
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
  )
}
