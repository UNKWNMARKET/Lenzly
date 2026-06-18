import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, Briefcase, MapPin, Calendar, DollarSign, Wifi, Building2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import PullToRefreshWrapper from '@/components/PullToRefreshWrapper'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'

interface Job {
  id: string
  user_id: string
  title: string
  description: string | null
  project_type: string | null
  location: string | null
  is_remote: boolean
  budget: string | null
  shoot_date: string | null
  created_at: string
  company?: string | null
  logo_url?: string | null
}

const TYPES = ['All', 'Editorial', 'Commercial', 'Events', 'Product', 'Fashion', 'Campaign', 'Portrait', 'Real Estate', 'Food']

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function timeAgo(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Jobs() {
  const [, navigate] = useLocation()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [active, setActive] = useState<Job | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('photography_jobs')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    let list = (data as Job[]) ?? []
    // Attach the posting company's name + logo
    const ids = [...new Set(list.map(j => j.user_id))]
    if (ids.length) {
      const { data: bps } = await supabase
        .from('business_profiles')
        .select('user_id, company, logo_url')
        .in('user_id', ids)
      const map = new Map((bps ?? []).map((b: any) => [b.user_id, b]))
      list = list.map(j => ({ ...j, company: map.get(j.user_id)?.company ?? null, logo_url: map.get(j.user_id)?.logo_url ?? null }))
    }
    setJobs(list)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  const pull = usePullToRefresh({ onRefresh: load })

  const filtered = filter === 'All' ? jobs : jobs.filter(j => j.project_type === filter)

  return (
    <div className="min-h-screen bg-lenz-bg">
      {/* Header */}
      <header className="sticky top-0 z-20 glass border-b border-white/5 safe-top">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate('/')} className="text-white/60 hover:text-white">
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-semibold text-[17px] leading-tight">Photography Jobs</h1>
            <p className="text-[11px] text-white/35">{jobs.length} open {jobs.length === 1 ? 'opening' : 'openings'}</p>
          </div>
          <Briefcase size={20} className="text-gold" />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === t ? 'bg-gold text-lenz-bg' : 'bg-white/5 text-white/45 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>
      </header>

      <PullToRefreshWrapper {...pull}>
        <div className="px-4 py-4 pb-28 space-y-3">
          {loading ? (
            <div className="text-center py-20 text-white/30 text-sm">Loading jobs…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase size={30} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/35 text-sm">No open jobs{filter !== 'All' ? ` for ${filter}` : ''} right now</p>
              <p className="text-white/20 text-xs mt-1">Check back soon — brands post new gigs often.</p>
            </div>
          ) : (
            filtered.map(job => (
              <button key={job.id} onClick={() => setActive(job)}
                className="w-full text-left bg-lenz-card border border-white/8 rounded-2xl p-4 active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-lenz-card2 overflow-hidden flex items-center justify-center shrink-0">
                    {job.logo_url ? <img src={job.logo_url} className="w-full h-full object-cover" /> : <Building2 size={17} className="text-gold/40" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/40 truncate">{job.company || 'A brand on Lenzly'}</p>
                    <h3 className="text-white font-semibold text-[15px] leading-tight truncate">{job.title}</h3>
                  </div>
                  <span className="text-[10px] text-white/25 shrink-0">{timeAgo(job.created_at)}</span>
                </div>
                {job.description && <p className="text-sm text-white/50 leading-snug line-clamp-2 mb-3">{job.description}</p>}
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-white/40">
                  {job.project_type && <span className="flex items-center gap-1"><Briefcase size={11} /> {job.project_type}</span>}
                  {(job.location || job.is_remote) && <span className="flex items-center gap-1"><MapPin size={11} /> {job.is_remote ? 'Remote' : job.location}</span>}
                  {job.budget && <span className="flex items-center gap-1"><DollarSign size={11} /> {job.budget}</span>}
                  {job.shoot_date && <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(job.shoot_date)}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      </PullToRefreshWrapper>

      {/* Detail sheet */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setActive(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div onClick={e => e.stopPropagation()}
            className="relative w-full bg-lenz-card border-t border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto safe-bottom animate-slide-up">
            <div className="sticky top-0 bg-lenz-card flex items-center justify-between px-5 py-4 border-b border-white/5">
              <span className="text-xs text-white/40">Job details</span>
              <button onClick={() => setActive(null)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <div className="px-5 py-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-lenz-card2 overflow-hidden flex items-center justify-center shrink-0">
                  {active.logo_url ? <img src={active.logo_url} className="w-full h-full object-cover" /> : <Building2 size={20} className="text-gold/40" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white/40">{active.company || 'A brand on Lenzly'}</p>
                  <h2 className="text-white font-semibold text-lg leading-tight">{active.title}</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {active.project_type && <Detail icon={Briefcase} label="Type" value={active.project_type} />}
                {(active.location || active.is_remote) && <Detail icon={active.is_remote ? Wifi : MapPin} label="Location" value={active.is_remote ? 'Remote' : active.location!} />}
                {active.budget && <Detail icon={DollarSign} label="Budget" value={active.budget} />}
                {active.shoot_date && <Detail icon={Calendar} label="Shoot date" value={fmtDate(active.shoot_date)!} />}
              </div>

              {active.description && (
                <div className="mb-6">
                  <p className="text-xs text-white/40 mb-1.5 uppercase tracking-wide">About this job</p>
                  <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{active.description}</p>
                </div>
              )}

              <p className="text-center text-[11px] text-white/25 mb-2">Posted {timeAgo(active.created_at)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-black/30 border border-white/8 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] text-white/35 uppercase tracking-wide mb-0.5">
        <Icon size={11} /> {label}
      </div>
      <p className="text-sm text-white font-medium">{value}</p>
    </div>
  )
}
