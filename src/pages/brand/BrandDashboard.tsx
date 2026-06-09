import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { Building2, Search, Bookmark, Send, LogOut, ChevronRight, Star, Users } from 'lucide-react'
import { useBrandAuth } from '@/contexts/BrandAuthContext'

interface HireRequest {
  id: string
  photographerId: string
  status: 'pending' | 'cancelled'
  createdAt: string
  photographer?: { name: string; avatar_url: string | null }
}

export default function BrandDashboard() {
  const { brand, logout, api } = useBrandAuth()
  const [, navigate] = useLocation()
  const [recentRequests, setRecentRequests] = useState<HireRequest[]>([])
  const [shortlistCount, setShortlistCount] = useState(0)

  useEffect(() => {
    api('/hire-requests').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setRecentRequests(data.slice(0, 3))
      }
    }).catch(() => {})
    api('/shortlist').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setShortlistCount(data.length)
    }).catch(() => {})
  }, [])

  function handleLogout() {
    logout()
    navigate('/brand-portal/login')
  }

  const stats = [
    { label: 'Shortlisted', value: shortlistCount, icon: Bookmark, action: () => navigate('/brand-portal/shortlist') },
    { label: 'Hire Requests', value: recentRequests.length, icon: Send, action: () => navigate('/brand-portal/requests') },
  ]

  return (
    <div className="min-h-screen bg-[#060606]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#060606]/90 backdrop-blur border-b border-[#1A1A1A] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
            <Building2 size={15} className="text-[#C9A84C]" />
          </div>
          <div>
            <p className="text-xs font-bold text-white tracking-widest">LENZLY</p>
            <p className="text-[10px] text-[#C9A84C]/60 tracking-wider">BRAND PORTAL</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
          <LogOut size={14} />
          Sign out
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <p className="text-xs text-[#C9A84C]/60 tracking-widest uppercase mb-1">Welcome back</p>
          <h1 className="text-2xl font-bold text-white">{brand?.company}</h1>
          <p className="text-sm text-white/40 mt-1">{brand?.email}</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map(({ label, value, icon: Icon, action }) => (
            <button key={label} onClick={action} className="bg-[#0E0E0E] border border-[#1A1A1A] rounded-2xl p-5 text-left hover:border-[#C9A84C]/20 transition-colors group">
              <Icon size={20} className="text-[#C9A84C] mb-3" />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
              <div className="flex items-center gap-1 mt-3 text-[10px] text-[#C9A84C]/50 group-hover:text-[#C9A84C]/80 transition-colors">
                View all <ChevronRight size={10} />
              </div>
            </button>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-[#0E0E0E] border border-[#1A1A1A] rounded-2xl overflow-hidden">
          <p className="text-[10px] text-white/30 tracking-widest uppercase px-5 pt-4 pb-2">Quick actions</p>
          {[
            { icon: Search, label: 'Discover Photographers', sub: 'Search and filter PRO talent', path: '/brand-portal/search' },
            { icon: Bookmark, label: 'My Shortlist', sub: `${shortlistCount} photographer${shortlistCount !== 1 ? 's' : ''} saved`, path: '/brand-portal/shortlist' },
            { icon: Send, label: 'Hire Requests', sub: `${recentRequests.length} total request${recentRequests.length !== 1 ? 's' : ''}`, path: '/brand-portal/requests' },
            { icon: Users, label: 'Account Settings', sub: 'Change password', path: '/brand-portal/settings' },
          ].map(({ icon: Icon, label, sub, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="w-full flex items-center gap-4 px-5 py-4 border-b border-[#141414] last:border-0 hover:bg-white/3 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-white/50" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-white/30 mt-0.5">{sub}</p>
              </div>
              <ChevronRight size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
            </button>
          ))}
        </div>

        {/* Recent hire requests */}
        {recentRequests.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-white/50 tracking-wider uppercase">Recent Requests</p>
              <button onClick={() => navigate('/brand-portal/requests')} className="text-[11px] text-[#C9A84C] font-medium">View all</button>
            </div>
            <div className="space-y-2">
              {recentRequests.map(r => (
                <div key={r.id} className="bg-[#0E0E0E] border border-[#1A1A1A] rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/5 overflow-hidden shrink-0">
                    {r.photographer?.avatar_url
                      ? <img src={r.photographer.avatar_url} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs font-bold">{r.photographer?.name?.[0] ?? '?'}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{r.photographer?.name ?? 'Photographer'}</p>
                    <p className="text-xs text-white/30">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    r.status === 'pending' ? 'bg-yellow-950/40 text-yellow-400' : 'bg-white/5 text-white/30'
                  }`}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
