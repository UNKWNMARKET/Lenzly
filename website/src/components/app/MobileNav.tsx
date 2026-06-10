import { Link, useLocation } from 'react-router-dom'
import { Home, Compass, PlusSquare, MessageCircle, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

export default function MobileNav() {
  const { pathname } = useLocation()
  const { profile } = useAuth()
  const tabs = [
    { to: '/app', icon: Home, exact: true },
    { to: '/app/explore', icon: Compass },
    { to: '/app/upload', icon: PlusSquare },
    { to: '/app/messages', icon: MessageCircle },
    { to: `/app/u/${profile?.username ?? ''}`, icon: User },
  ]
  const isActive = (to: string, exact?: boolean) => exact ? pathname === to : pathname.startsWith(to)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/8">
      <div className="flex items-center justify-around px-2 py-2" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}>
        {tabs.map(({ to, icon: Icon, exact }, i) => (
          <Link key={i} to={to} className="flex-1 flex justify-center py-2">
            <Icon size={24} strokeWidth={isActive(to, exact) ? 2.3 : 1.7} className={cn('transition-all', isActive(to, exact) ? 'text-gold' : 'text-white/40')} />
          </Link>
        ))}
      </div>
    </nav>
  )
}
