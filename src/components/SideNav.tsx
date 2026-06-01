import { Home, Compass, MapPin, User, PlusSquare, Heart } from 'lucide-react'
import { useLocation, Link } from 'wouter'
import { cn } from '@/lib/utils'

const tabs = [
  { path: '/', icon: Home, label: 'Feed' },
  { path: '/explore', icon: Compass, label: 'Explore' },
  { path: '/weddings', icon: Heart, label: 'Wedding Venues' },
  { path: '/upload', icon: PlusSquare, label: 'Upload', isUpload: true },
  { path: '/find', icon: MapPin, label: 'Find' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export default function SideNav() {
  const [location] = useLocation()

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[220px] z-50 bg-[#0a0a0a] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-6 pt-10 pb-8">
        <h1 className="text-xl font-bold tracking-[0.18em] gold-text">LENZLY</h1>
        <p className="text-[8px] text-white/20 tracking-[0.35em] uppercase mt-0.5">Photography Platform</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1">
        {tabs.map(({ path, icon: Icon, label, isUpload }) => {
          const active = path === '/'
            ? location === '/'
            : location.startsWith(path)

          if (isUpload) {
            return (
              <Link key={path} href={path}>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl group transition-all duration-200 active:scale-[0.98]">
                  <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center shadow-md shadow-gold/20 shrink-0">
                    <Icon size={19} strokeWidth={2.2} className="text-lenz-bg" />
                  </div>
                  <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">{label}</span>
                </button>
              </Link>
            )
          }

          return (
            <Link key={path} href={path}>
              <button className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group active:scale-[0.98]',
                active ? 'bg-gold/10' : 'hover:bg-white/5'
              )}>
                <Icon
                  size={20}
                  strokeWidth={active ? 2.2 : 1.6}
                  className={cn(
                    'transition-all duration-200 shrink-0',
                    active ? 'text-gold' : 'text-white/40 group-hover:text-white/60'
                  )}
                />
                <span className={cn(
                  'text-sm font-semibold transition-colors duration-200',
                  active ? 'text-gold' : 'text-white/50 group-hover:text-white/70'
                )}>
                  {label}
                </span>
              </button>
            </Link>
          )
        })}
      </nav>

      {/* Bottom padding for safe area */}
      <div className="h-8" />
    </aside>
  )
}
