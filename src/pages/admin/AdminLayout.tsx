import { ReactNode, useState } from 'react'
import { useLocation, Link } from 'wouter'
import {
  LayoutDashboard, MapPin, Users, Image, Building2,
  Settings, Menu, X, Camera, Bell, ChevronRight, ArrowLeft
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const nav = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/spots', label: 'Photo Spots', icon: MapPin },
  { path: '/admin/photographers', label: 'Photographers', icon: Users },
  { path: '/admin/posts', label: 'Posts', icon: Image },
  { path: '/admin/brands', label: 'Brands', icon: Building2 },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [location, navigate] = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const adminLabel = user?.email ?? 'Administrator'

  return (
    <div className="bg-[#050505] flex" style={{ position: 'fixed', inset: 0, zIndex: 100, overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#A88A35] flex items-center justify-center">
              <Camera size={18} className="text-[#080808]" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.15em] text-[#C9A84C]">LENZLY</p>
              <p className="text-[10px] text-white/25 tracking-widest uppercase">Admin Console</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ path, label, icon: Icon }) => {
            const active = path === '/admin' ? location === '/admin' : location.startsWith(path)
            return (
              <Link key={path} href={path}>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    active
                      ? 'bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  )}
                >
                  <Icon size={16} />
                  {label}
                  {active && <ChevronRight size={14} className="ml-auto text-[#C9A84C]/60" />}
                </button>
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
              <span className="text-xs font-bold text-[#C9A84C] uppercase">
                {adminLabel[0] ?? 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{adminLabel}</p>
              <p className="text-[10px] text-white/30">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft size={16} />
            Exit Admin
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 md:ml-60 flex flex-col overflow-hidden h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#080808]/90 backdrop-blur-md border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className="md:hidden p-1.5 rounded-lg text-white/40 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="hidden md:block">
            <h2 className="text-sm font-semibold text-white/60">
              {nav.find(n => n.path === '/admin' ? location === '/admin' : location.startsWith(n.path))?.label ?? 'Admin'}
            </h2>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="p-2 rounded-lg text-white/30 hover:text-white/60 transition-colors relative">
              <Bell size={17} />
            </button>
            <Link href="/">
              <button className="text-xs text-white/30 hover:text-white/60 transition-colors">
                ← View App
              </button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
