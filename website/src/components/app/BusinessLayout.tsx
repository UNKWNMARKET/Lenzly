import { useState } from 'react'
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, Bookmark, Send, LogOut, ArrowLeft, ShieldCheck, KeyRound, Menu, X, Building2, Briefcase } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

const nav = [
  { to: '/business', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/business/page', icon: Building2, label: 'Company Page' },
  { to: '/business/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/business/discover', icon: Search, label: 'Discover' },
  { to: '/business/shortlist', icon: Bookmark, label: 'Shortlist' },
  { to: '/business/requests', icon: Send, label: 'Hire Requests' },
]

export default function BusinessLayout() {
  const { user, loading, profile, signOut } = useAuth()
  const { pathname } = useLocation()
  const isActive = (to: string, exact?: boolean) => exact ? pathname === to : pathname.startsWith(to)
  const isAdmin = user?.email?.toLowerCase() === 'eisdorferjesse@gmail.com'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-lenz-bg"><div className="w-8 h-8 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>
  if (!user) return <Navigate to="/business/login" replace />

  return (
    <div className="min-h-screen bg-lenz-bg">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-white/5 bg-[#070707] z-40 px-4 py-6">
        <Link to="/business" className="px-3 mb-1"><span className="text-xl font-black tracking-[0.25em] gold-text">LENZLY</span></Link>
        <p className="px-3 text-[10px] text-white/25 tracking-[0.3em] uppercase mb-8">Business Portal</p>
        <nav className="flex-1 space-y-1">
          {nav.map(({ to, icon: Icon, label, exact }) => (
            <Link key={to} to={to} className={cn('flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium transition-all', isActive(to, exact) ? 'bg-gold/10 text-gold' : 'text-white/55 hover:bg-white/5 hover:text-white')}>
              <Icon size={20} strokeWidth={isActive(to, exact) ? 2.3 : 1.8} /> {label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 pt-4 border-t border-white/5">
          <Link to="/business/change-password" className="flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium text-white/55 hover:bg-white/5 hover:text-white transition-all">
            <KeyRound size={20} strokeWidth={1.8} /> Change Password
          </Link>
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium text-gold/70 hover:bg-gold/10 hover:text-gold transition-all">
              <ShieldCheck size={20} strokeWidth={1.8} /> Admin
            </Link>
          )}
          <Link to="/app" className="flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium text-white/55 hover:bg-white/5 hover:text-white transition-all">
            <ArrowLeft size={20} strokeWidth={1.8} /> Back to App
          </Link>
          <button onClick={signOut} className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium text-white/55 hover:bg-white/5 hover:text-white transition-all">
            <LogOut size={20} strokeWidth={1.8} /> Sign Out
          </button>
          {profile && <div className="px-3 pt-2 text-xs text-white/30">Signed in as <span className="text-white/60">@{profile.username}</span></div>}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 glass border-b border-white/5 flex items-center justify-between px-4 h-14">
        <Link to="/business" className="text-base font-black tracking-[0.2em] gold-text">LENZLY <span className="text-[9px] text-white/30 tracking-normal">BUSINESS</span></Link>
        <button onClick={() => setMobileMenuOpen(true)} className="text-white/50 hover:text-white transition-colors p-1">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative ml-auto w-72 h-full bg-[#080808] border-l border-white/8 flex flex-col px-4 py-6">
            <div className="flex items-center justify-between mb-8 px-2">
              <span className="text-base font-black tracking-[0.25em] gold-text">LENZLY</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {nav.map(({ to, icon: Icon, label, exact }) => (
                <Link key={to} to={to} onClick={() => setMobileMenuOpen(false)}
                  className={cn('flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium transition-all', isActive(to, exact) ? 'bg-gold/10 text-gold' : 'text-white/55 hover:bg-white/5 hover:text-white')}>
                  <Icon size={20} strokeWidth={isActive(to, exact) ? 2.3 : 1.8} /> {label}
                </Link>
              ))}
            </nav>

            <div className="space-y-1 pt-4 border-t border-white/8">
              <Link to="/business/change-password" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium text-white/55 hover:bg-white/5 hover:text-white transition-all">
                <KeyRound size={20} strokeWidth={1.8} /> Change Password
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium text-gold/70 hover:bg-gold/10 hover:text-gold transition-all">
                  <ShieldCheck size={20} strokeWidth={1.8} /> Admin Portal
                </Link>
              )}
              <Link to="/app" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium text-white/55 hover:bg-white/5 hover:text-white transition-all">
                <ArrowLeft size={20} strokeWidth={1.8} /> Back to App
              </Link>
              <button onClick={() => { setMobileMenuOpen(false); signOut() }}
                className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium text-white/55 hover:bg-white/5 hover:text-white transition-all">
                <LogOut size={20} strokeWidth={1.8} /> Sign Out
              </button>
              {profile && <div className="px-3 pt-3 text-xs text-white/30">Signed in as <span className="text-white/60">@{profile.username}</span></div>}
            </div>
          </div>
        </div>
      )}

      <main className="md:pl-64 pb-24 md:pb-0 min-h-screen"><Outlet /></main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/8">
        <div className="flex items-center justify-around px-2 py-2" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}>
          {nav.map(({ to, icon: Icon, exact }) => (
            <Link key={to} to={to} className="flex-1 flex justify-center py-2">
              <Icon size={22} strokeWidth={isActive(to, exact) ? 2.3 : 1.7} className={isActive(to, exact) ? 'text-gold' : 'text-white/40'} />
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
