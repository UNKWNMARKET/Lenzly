import { useEffect, useState } from 'react'
import { Users, Camera, Image, Building2, MapPin, Handshake, TrendingUp, RefreshCw, Eye, Activity } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalUsers: number
  totalPhotographers: number
  totalBrands: number
  totalPosts: number
  totalSpots: number
  totalHires: number
}

interface BrandApp {
  id: string
  company: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

const statCards = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: '#C9A84C' },
  { key: 'totalPhotographers', label: 'Photographers', icon: Camera, color: '#6C8EEF' },
  { key: 'totalPosts', label: 'Posts', icon: Image, color: '#E07B5A' },
  { key: 'totalBrands', label: 'Brands', icon: Building2, color: '#5AC88E' },
  { key: 'totalSpots', label: 'Photo Spots', icon: MapPin, color: '#B06AC8' },
  { key: 'totalHires', label: 'Total Hires', icon: Handshake, color: '#5AB8C8' },
] as const

interface LiveStats {
  visitors_today: number; visitors_week: number; visitors_month: number
  web_visitors_today: number; app_visitors_today: number
  views_today: number
  posts_today: number; posts_week: number; posts_month: number
  members_today: number; members_week: number; members_month: number
}

export default function AdminDashboard() {
  const { api } = useAdminAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [brands, setBrands] = useState<BrandApp[]>([])
  const [live, setLive] = useState<LiveStats | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [sRes, bRes] = await Promise.all([api('/stats'), api('/brands')])
    if (sRes.ok) setStats(await sRes.json())
    if (bRes.ok) setBrands(await bRes.json())
    // Live analytics via Supabase (only works when signed into Supabase as admin)
    supabase.rpc('admin_dashboard_stats').then(({ data, error }) => {
      if (!error && data) setLive(data as LiveStats)
    })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const pending = brands.filter(b => b.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-xs text-white/40 mt-0.5">Platform overview</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {statCards.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon size={15} style={{ color }} />
              </div>
              <TrendingUp size={12} className="text-green-500/60" />
            </div>
            <p className="text-2xl font-bold text-white">
              {loading ? '—' : (stats?.[key as keyof Stats] ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Live analytics (Supabase) */}
      {live && (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-white">Live Analytics</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <LiveCard icon={Eye} label="Visitors" today={live.visitors_today} week={live.visitors_week} month={live.visitors_month} />
            <LiveCard icon={Image} label="Posts" today={live.posts_today} week={live.posts_week} month={live.posts_month} />
            <LiveCard icon={Users} label="Members" today={live.members_today} week={live.members_week} month={live.members_month} />
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#1a1a1a] text-[11px] text-white/40">
            <span className="flex items-center gap-1.5"><Activity size={12} className="text-gold" /> {live.views_today.toLocaleString()} views today</span>
            <span>·</span>
            <span>{live.web_visitors_today.toLocaleString()} web</span>
            <span>{live.app_visitors_today.toLocaleString()} app</span>
          </div>
        </div>
      )}

      {/* Pending brand applications */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Pending Brand Applications</h2>
          {pending.length > 0 && (
            <span className="text-xs bg-[#C9A84C]/15 text-[#C9A84C] px-2 py-0.5 rounded-full font-medium">
              {pending.length} new
            </span>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-white/30">
            No pending applications
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {pending.map(b => (
              <div key={b.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{b.company}</p>
                  <p className="text-xs text-white/40">{b.email}</p>
                </div>
                <span className="text-xs text-yellow-400/70 bg-yellow-950/30 px-2.5 py-1 rounded-full">
                  Pending
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 [&_a]:no-underline">
        {[
          { label: 'Review Brand Apps', href: '/admin/brands', color: '#C9A84C' },
          { label: 'Moderate Posts', href: '/admin/posts', color: '#E07B5A' },
          { label: 'Manage Spots', href: '/admin/spots', color: '#B06AC8' },
          { label: 'App Settings', href: '/admin/settings', color: '#5AC88E' },
        ].map(({ label, href, color }) => (
          <a
            key={href}
            href={href}
            className="bg-[#111] border border-[#1e1e1e] rounded-2xl px-4 py-3.5 text-sm font-medium text-white/60 hover:text-white hover:border-white/10 transition-all flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}

function LiveCard({ icon: Icon, label, today, week, month }: {
  icon: typeof Eye; label: string; today: number; week: number; month: number
}) {
  return (
    <div className="bg-black/30 border border-[#1a1a1a] rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-2 text-white/40">
        <Icon size={13} className="text-gold" />
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="text-xl font-bold text-white leading-none">{today.toLocaleString()}</p>
      <p className="text-[9px] text-white/30 mt-0.5">today</p>
      <div className="flex gap-2 mt-2 pt-2 border-t border-white/5 text-[10px] text-white/40">
        <span>{week.toLocaleString()}<span className="text-white/20"> /wk</span></span>
        <span>{month.toLocaleString()}<span className="text-white/20"> /mo</span></span>
      </div>
    </div>
  )
}
