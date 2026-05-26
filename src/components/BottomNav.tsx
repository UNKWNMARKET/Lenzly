import { Home, Compass, MapPin, User } from 'lucide-react'
import { useLocation, Link } from 'wouter'
import { cn } from '@/lib/utils'

const tabs = [
  { path: '/', icon: Home, label: 'Feed' },
  { path: '/explore', icon: Compass, label: 'Explore' },
  { path: '/find', icon: MapPin, label: 'Find' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const [location] = useLocation()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass-dark z-50 safe-bottom">
      <div className="flex items-center justify-around px-4 py-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = path === '/'
            ? location === '/'
            : location.startsWith(path)

          return (
            <Link key={path} href={path}>
              <button className="flex flex-col items-center gap-1 py-2 px-4 group">
                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={active ? 2 : 1.5}
                    className={cn(
                      'transition-all duration-200',
                      active ? 'text-gold' : 'text-white/30 group-hover:text-white/50'
                    )}
                  />
                  {active && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium tracking-wider uppercase transition-colors duration-200',
                    active ? 'text-gold' : 'text-white/25 group-hover:text-white/40'
                  )}
                >
                  {label}
                </span>
              </button>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
