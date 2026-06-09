import { Link, useLocation } from 'react-router-dom'
import { Home, Compass, Search, MessageCircle, Bell, PlusSquare, Settings, LogOut, Briefcase } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

const nav = [
  { to: '/app', icon: Home, label: 'Feed', exact: true },
  { to: '/app/explore', icon: Compass, label: 'Explore' },
  { to: '/app/search', icon: Search, label: 'Search' },
  { to: '/app/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/app/notifications', icon: Bell, label: 'Notifications' },
  { to: '/app/upload', icon: PlusSquare, label: 'Create' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { profile, signOut } = useAuth()

  const isActive = (to: string, exact?: boolean) => exact ? pathname === to : pathname.startsWith(to)

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-white/5 bg-[#070707] z-40 px-4 py-6">
      <Link to="/app" className="px-3 mb-8">
        <span className="text-xl font-black tracking-[0.25em] gold-text">LENZLY</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {nav.map(({ to, icon: Icon, label, exact }) => (
          <Link key={to} to={to}
            className={cn(
              'flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium transition-all group',
              isActive(to, exact) ? 'bg-gold/10 text-gold' : 'text-white/55 hover:bg-white/5 hover:text-white'
            )}>
            <Icon size={21} strokeWidth={isActive(to, exact) ? 2.3 : 1.8} className="transition-transform group-hover:scale-105" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="space-y-1 pt-4 border-t border-white/5">
        <Link to="/business"
          className="flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium text-white/55 hover:bg-white/5 hover:text-white transition-all">
          <Briefcase size={21} strokeWidth={1.8} /> Business
        </Link>
        <Link to="/app/settings"
          className={cn('flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium transition-all',
            isActive('/app/settings') ? 'bg-gold/10 text-gold' : 'text-white/55 hover:bg-white/5 hover:text-white')}>
          <Settings size={21} strokeWidth={1.8} /> Settings
        </Link>

        {profile && (
          <Link to={`/app/u/${profile.username}`} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all mt-2">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-lenz-card2 border border-white/10 shrink-0">
              {profile.avatar_url
                ? <img src={profile.avatar_url} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gold/50 font-bold text-sm">{profile.name?.[0]}</div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{profile.name}</p>
              <p className="text-xs text-white/35 truncate">@{profile.username}</p>
            </div>
            <button onClick={(e) => { e.preventDefault(); signOut() }} className="text-white/30 hover:text-white/70 transition-colors">
              <LogOut size={16} />
            </button>
          </Link>
        )}
      </div>
    </aside>
  )
}
