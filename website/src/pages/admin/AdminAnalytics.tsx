import { useState, useEffect, useCallback, useRef } from 'react'
import { Users, Image, Eye, TrendingUp, Activity, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Stats {
  members_total: number; members_today: number; members_week: number; members_month: number
  posts_total: number; posts_today: number; posts_week: number; posts_month: number
  visitors_today: number; visitors_week: number; visitors_month: number
  views_today: number; views_week: number; views_month: number
  generated_at: string
}

interface SeriesPoint { day: string; members: number; posts: number; visitors: number }

type Metric = 'visitors' | 'posts' | 'members'

const METRIC_LABEL: Record<Metric, string> = { visitors: 'Visitors', posts: 'Posts', members: 'New Members' }

export default function AdminAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [series, setSeries] = useState<SeriesPoint[]>([])
  const [metric, setMetric] = useState<Metric>('visitors')
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    const [{ data: s }, { data: ser }] = await Promise.all([
      supabase.rpc('admin_dashboard_stats'),
      supabase.rpc('admin_daily_series', { days: 14 }),
    ])
    if (s) setStats(s as Stats)
    if (ser) setSeries(ser as SeriesPoint[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    // Poll every 20s for near real-time numbers
    timer.current = setInterval(load, 20000)
    // Push updates: refresh instantly when new visits / posts / signups land
    const ch = supabase
      .channel('admin-analytics')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'site_visits' }, () => { setLive(true); load() })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => { setLive(true); load() })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => { setLive(true); load() })
      .subscribe((status) => { if (status === 'SUBSCRIBED') setLive(true) })
    return () => {
      if (timer.current) clearInterval(timer.current)
      supabase.removeChannel(ch)
    }
  }, [load])

  const cards: { label: string; icon: any; today: number; week: number; month: number; total?: number }[] = stats ? [
    { label: 'Visitors', icon: Eye, today: stats.visitors_today, week: stats.visitors_week, month: stats.visitors_month },
    { label: 'Page Views', icon: Activity, today: stats.views_today, week: stats.views_week, month: stats.views_month },
    { label: 'New Posts', icon: Image, today: stats.posts_today, week: stats.posts_week, month: stats.posts_month, total: stats.posts_total },
    { label: 'New Members', icon: Users, today: stats.members_today, week: stats.members_week, month: stats.members_month, total: stats.members_total },
  ] : []

  const max = Math.max(1, ...series.map(p => p[metric]))

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-serif text-white">Live Analytics</h2>
          <span className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full border ${live ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-white/10 text-white/40'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-green-400 animate-pulse' : 'bg-white/30'}`} />
            {live ? 'Live' : 'Connecting…'}
          </span>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-gold transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-5 h-[132px] animate-pulse opacity-40" />)
        ) : cards.map(c => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40">{c.label}</span>
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                <c.icon size={15} className="text-gold" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-white tracking-tight">{c.today.toLocaleString()}</div>
            <div className="text-[11px] text-white/30 mt-0.5">today</div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
              <div>
                <div className="text-sm font-medium text-white/80">{c.week.toLocaleString()}</div>
                <div className="text-[10px] text-white/30 uppercase tracking-wide">7 days</div>
              </div>
              <div>
                <div className="text-sm font-medium text-white/80">{c.month.toLocaleString()}</div>
                <div className="text-[10px] text-white/30 uppercase tracking-wide">30 days</div>
              </div>
              {c.total !== undefined && (
                <div className="ml-auto text-right">
                  <div className="text-sm font-medium text-gold">{c.total.toLocaleString()}</div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wide">all time</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-gold" />
            <h3 className="text-sm font-medium text-white">Last 14 days</h3>
          </div>
          <div className="flex gap-1 bg-black/30 border border-white/10 rounded-lg p-1">
            {(['visitors', 'posts', 'members'] as Metric[]).map(m => (
              <button key={m} onClick={() => setMetric(m)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${metric === m ? 'bg-gold text-lenz-bg' : 'text-white/40 hover:text-white'}`}>
                {METRIC_LABEL[m]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-40">
          {series.map(p => {
            const v = p[metric]
            const h = Math.round((v / max) * 100)
            return (
              <div key={p.day} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="relative w-full flex items-end justify-center" style={{ height: '100%' }}>
                  <div className="w-full rounded-t-md bg-gold/70 group-hover:bg-gold transition-all min-h-[2px]"
                    style={{ height: `${h}%` }} />
                  <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium text-white bg-black/80 border border-white/10 rounded px-1.5 py-0.5 whitespace-nowrap">
                    {v.toLocaleString()}
                  </div>
                </div>
                <span className="text-[9px] text-white/30">
                  {new Date(p.day + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                </span>
              </div>
            )
          })}
          {series.length === 0 && <div className="w-full text-center text-white/30 text-sm self-center">No data yet</div>}
        </div>
      </div>
    </section>
  )
}
