import { Link, useLocation } from 'react-router-dom'
import { Home, Compass, Search, MessageCircle, Bell, PlusSquare, Settings, LogOut, Briefcase, Aperture } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

const nav = [
  { to: '/app', icon: Home, label: 'Feed', exact: true },
  { to: '/app/explore', icon: Compass, label: 'Explore' },
  { to: '/app/search', icon: Search, label: 'Find a Photographer' },
  { to: '/app/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/app/notifications', icon: Bell, label: 'Notifications' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { profile, signOut } = useAuth()

  const isActive = (to: string, exact?: boolean) => exact ? pathname === to : pathname.startsWith(to)

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[260px] flex-col border-r border-white/[0.06] bg-[#0b0b0d] z-40 px-4 py-6">
      {/* Brand */}
      <Link to="/app" className="flex items-center gap-3 px-2 mb-9">
        <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center shrink-0">
          <Aperture size={20} className="text-gold" strokeWidth={2} />
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-bold tracking-[0.22em] text-white/35 uppercase">Lenzly</p>
          <p className="text-[15px] font-semibold text-white -mt-0.5">Photo network</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1.5">
        {nav.map(({ to, icon: Icon, label, exact }) => {
          const active = isActive(to, exact)
          return (
            <Link key={to} to={to}
              className={cn(
                'flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] transition-all group',
                active
                  ? 'bg-gold text-[#181203] font-semibold shadow-lg shadow-gold/15'
                  : 'text-white/55 font-medium hover:bg-white/[0.04] hover:text-white'
              )}>
              <Icon size={20} strokeWidth={active ? 2.4 : 1.9} className="shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Create post */}
      <Link to="/app/upload"
        className="flex items-center justify-center gap-2 mb-3 px-4 py-3 rounded-2xl border border-gold/30 text-gold font-semibold text-sm hover:bg-gold/[0.07] transition-all">
        <PlusSquare size={18} strokeWidth={2} /> Create Post
      </Link>

      <div className="space-y-1 pt-3 border-t border-white/[0.06]">
        <Link to="/business"
          className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-sm font-medium text-white/45 hover:bg-white/[0.04] hover:text-white transition-all">
          <Briefcase size={18} strokeWidth={1.9} /> For Brands
        </Link>
        <Link to="/app/settings"
          className={cn('flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all',
            isActive('/app/settings') ? 'text-gold' : 'text-white/45 hover:bg-white/[0.04] hover:text-white')}>
          <Settings size={18} strokeWidth={1.9} /> Settings
        </Link>

        {profile && (
          <div className="flex items-center gap-3 px-2 py-3 mt-1">
            <Link to={`/app/u/${profile.username}`} className="flex items-center gap-3 min-w-0 flex-1 group">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-lenz-card2 border border-white/10 shrink-0">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gold/60 font-bold text-sm">{profile.name?.[0]}</div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate group-hover:text-gold transition-colors">{profile.name}</p>
                <p className="text-xs text-white/35 truncate">@{profile.username}</p>
              </div>
            </Link>
            <button onClick={() => signOut()} className="text-white/30 hover:text-white/70 transition-colors shrink-0" title="Log out">
              <LogOut size={17} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
