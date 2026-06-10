import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Bookmark, Send, Users, ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useShortlist, useHireRequests } from '../../hooks/useBusiness'

export default function BusinessDashboard() {
  const { profile } = useAuth()
  const { ids } = useShortlist()
  const { requests } = useHireRequests()
  const [proCount, setProCount] = useState(0)

  useEffect(() => {
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_pro', true)
      .then(({ count }) => setProCount(count ?? 0))
  }, [])

  const activeRequests = requests.filter(r => r.status !== 'cancelled')
  const greeting = profile?.name ? profile.name.split(' ')[0] : 'there'

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-10">

      {/* Welcome */}
      <div className="mb-10">
        <p className="text-[11px] text-gold/60 tracking-[0.25em] uppercase font-semibold mb-2">Business Portal</p>
        <h1 className="text-3xl md:text-4xl font-serif text-white mb-2">Welcome back, {greeting}.</h1>
        <p className="text-sm text-white/35">Find and hire world-class photographers for your brand.</p>
      </div>

      {/* Primary CTA */}
      <Link to="/business/discover"
        className="group block w-full mb-6 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/8 to-transparent px-8 py-7 hover:border-gold/40 transition-all relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full bg-gold/3 blur-[80px]" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/20 flex items-center justify-center">
                <Search size={18} className="text-gold" />
              </div>
              <div>
                <p className="text-white font-semibold text-base">Discover Photographers</p>
                <p className="text-xs text-white/35">{proCount.toLocaleString()} verified photographers available</p>
              </div>
            </div>
          </div>
          <ArrowRight size={18} className="text-gold/50 group-hover:text-gold group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </Link>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link to="/business/shortlist" className="group card p-5 hover:border-gold/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <Bookmark size={16} className="text-white/30 group-hover:text-gold transition-colors" />
            <ArrowRight size={13} className="text-white/15 group-hover:text-gold/60 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-white">{ids.length}</p>
          <p className="text-xs text-white/35 mt-0.5">Shortlisted</p>
        </Link>
        <Link to="/business/requests" className="group card p-5 hover:border-gold/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <Send size={16} className="text-white/30 group-hover:text-gold transition-colors" />
            <ArrowRight size={13} className="text-white/15 group-hover:text-gold/60 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-white">{activeRequests.length}</p>
          <p className="text-xs text-white/35 mt-0.5">Hire Requests</p>
        </Link>
      </div>

      {/* Recent hire requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/70 tracking-wide">Recent Requests</h2>
          {requests.length > 0 && (
            <Link to="/business/requests" className="text-xs text-gold/60 hover:text-gold transition-colors">View all</Link>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="card p-10 text-center">
            <Users size={28} className="text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30 mb-1">No hire requests yet</p>
            <p className="text-xs text-white/20 mb-5">Discover photographers and send your first request.</p>
            <Link to="/business/discover"
              className="inline-flex items-center gap-2 text-xs text-gold border border-gold/25 rounded-lg px-4 py-2 hover:bg-gold/8 transition-colors">
              <Search size={12} /> Start discovering
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.slice(0, 5).map(r => (
              <div key={r.id} className="card px-4 py-3.5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-lenz-card2 shrink-0">
                  {r.photographerAvatar
                    ? <img src={r.photographerAvatar} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gold/40 text-sm font-bold">{r.photographerName[0]}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{r.photographerName}</p>
                  <p className="text-xs text-white/30">{r.projectType}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'pending') return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-gold bg-gold/8 border border-gold/15 px-2.5 py-1 rounded-full">
      <Clock size={9} /> Pending
    </span>
  )
  if (status === 'accepted') return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-green-400 bg-green-500/8 border border-green-500/15 px-2.5 py-1 rounded-full">
      <CheckCircle size={9} /> Accepted
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-white/30 bg-white/4 border border-white/8 px-2.5 py-1 rounded-full">
      <XCircle size={9} /> {status}
    </span>
  )
}
