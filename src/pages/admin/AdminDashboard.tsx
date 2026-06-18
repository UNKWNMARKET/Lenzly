import { useEffect, useState } from 'react'
import { Users, Camera, Image, Building2, MapPin, Clock, RefreshCw, Eye, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Cards {
  users: number
  photographers: number
  posts: number
  brands: number
  spots: number
  pending: number
}

interface BrandApp {
  id: string
  company: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

interface LiveStats {
  visitors_today?: number; visitors_week?: number; visitors_month?: number
  web_visitors_today?: number; app_visitors_today?: number
  views_today?: number
  posts_today?: number; posts_week?: number; posts_month?: number
  members_today?: number; members_week?: number; members_month?: number
}

const statCards = [
  { key: 'users', label: 'Members', icon: Users, color: '#C9A84C' },
  { key: 'photographers', label: 'Pro Photographers', icon: Camera, color: '#6C8EEF' },
  { key: 'posts', label: 'Posts', icon: Image, color: '#E07B5A' },
  { key: 'brands', label: 'Approved Brands', icon: Building2, color: '#5AC88E' },
  { key: 'spots', label: 'Active Spots', icon: MapPin, color: '#B06AC8' },
  { key: 'pending', label: 'Pending Apps', icon: Clock, color: '#5AB8C8' },
] as const

export default function AdminDashboard() {
  const [cards, setCards] = useState<Cards | null>(null)
  const [pendingApps, setPendingApps] = useState<BrandApp[]>([])
  const [live, setLive] = useState<LiveStats | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)

    const head = { count: 'exact' as const, head: true }
    const [
      usersRes, prosRes, postsRes, approvedRes, spotsRes, pendingRes, pendingRowsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('id', head),
      supabase.from('profiles').select('id', head).eq('is_pro', true),
      supabase.from('posts').select('id', head),
      supabase.from('brand_applications').select('id', head).eq('status', 'approved'),
      supabase.from('spot_stories').select('id', head),
      supabase.from('brand_applications').select('id', head).eq('status', 'pending'),
      supabase.from('brand_applications').select('id, company, email, status, created_at')
        .eq('status', 'pending').order('created_at', { ascending: false }).limit(10),
    ])

    setCards({
      users: usersRes.count ?? 0,
      photographers: prosRes.count ?? 0,
      posts: postsRes.count ?? 0,
      brands: approvedRes.count ?? 0,
      spots: spotsRes.count ?? 0,
      pending: pendingRes.count ?? 0,
    })
    setPendingApps((pendingRowsRes.data as BrandApp[]) ?? [])

    // Live analytics RPC (admin-gated, security definer)
    const { data, error } = await supabase.rpc('admin_dashboard_stats')
    if (!error && data) setLive(data as LiveStats)

    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-xs text-white/40 mt-0.5">Platform overview</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all active:scale-90"
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
            </div>
            <p className="text-2xl font-bold text-white">
              {loading || !cards ? '—' : (cards[key as keyof Cards] ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Live analytics (Supabase RPC) */}
      {live && (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-white">Live Analytics</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <LiveCard icon={Eye} label="Visitors" today={live.visitors_today ?? 0} week={live.visitors_week ?? 0} month={live.visitors_month ?? 0} />
            <LiveCard icon={Image} label="Posts" today={live.posts_today ?? 0} week={live.posts_week ?? 0} month={live.posts_month ?? 0} />
            <LiveCard icon={Users} label="Members" today={live.members_today ?? 0} week={live.members_week ?? 0} month={live.members_month ?? 0} />
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#1a1a1a] text-[11px] text-white/40">
            <span className="flex items-center gap-1.5"><Activity size={12} className="text-gold" /> {(live.views_today ?? 0).toLocaleString()} views today</span>
            {(live.web_visitors_today != null || live.app_visitors_today != null) && (
              <>
                <span>·</span>
                <span>{(live.web_visitors_today ?? 0).toLocaleString()} web</span>
                <span>{(live.app_visitors_today ?? 0).toLocaleString()} app</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pending brand applications */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Pending Brand Applications</h2>
          {pendingApps.length > 0 && (
            <span className="text-xs bg-[#C9A84C]/15 text-[#C9A84C] px-2 py-0.5 rounded-full font-medium">
              {pendingApps.length} new
            </span>
          )}
        </div>
        {pendingApps.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-white/30">
            {loading ? 'Loading…' : 'No pending applications'}
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {pendingApps.map(b => (
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
            className="bg-[#111] border border-[#1e1e1e] rounded-2xl px-4 py-3.5 text-sm font-medium text-white/60 hover:text-white hover:border-white/10 transition-all flex items-center gap-2 active:scale-[0.98]"
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
