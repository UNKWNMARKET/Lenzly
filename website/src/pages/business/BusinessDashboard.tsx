import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Bookmark, Send, Users, ArrowRight, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useShortlist, useHireRequests } from '../../hooks/useBusiness'

export default function BusinessDashboard() {
  const { profile } = useAuth()
  const { ids } = useShortlist()
  const { requests } = useHireRequests()
  const [proCount, setProCount] = useState(0)

  useEffect(() => {
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_pro', true).then(({ count }) => setProCount(count ?? 0))
  }, [])

  const stats = [
    { icon: Users, label: 'Available Photographers', value: proCount.toLocaleString(), to: '/business/discover' },
    { icon: Bookmark, label: 'Shortlisted', value: ids.length, to: '/business/shortlist' },
    { icon: Send, label: 'Hire Requests', value: requests.filter(r => r.status !== 'cancelled').length, to: '/business/requests' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-8">
        <p className="section-label mb-2">Business Portal</p>
        <h1 className="text-3xl md:text-4xl font-serif text-white mb-2">Welcome back{profile ? `, ${profile.name.split(' ')[0]}` : ''}.</h1>
        <p className="text-sm text-white/40">Discover, shortlist, and hire world-class photographers.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {stats.map(({ icon: Icon, label, value, to }) => (
          <Link key={label} to={to} className="card-premium card-glow p-6 group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/10 flex items-center justify-center"><Icon size={19} className="text-gold" /></div>
              <ArrowRight size={16} className="text-white/20 group-hover:text-gold transition-colors" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            <p className="text-sm text-white/40">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/business/discover" className="card-premium p-8 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gold/5 blur-[60px] rounded-full" />
          <Search size={28} className="text-gold mb-4" />
          <h3 className="text-xl font-serif text-white mb-2">Discover Talent</h3>
          <p className="text-sm text-white/40 mb-5 leading-relaxed">Search thousands of verified photographers by specialty, location, and availability.</p>
          <span className="inline-flex items-center gap-2 text-sm text-gold font-medium">Start searching <ArrowRight size={14} /></span>
        </Link>
        <div className="card-premium p-8">
          <TrendingUp size={28} className="text-gold mb-4" />
          <h3 className="text-xl font-serif text-white mb-4">Recent Requests</h3>
          {requests.length === 0 ? (
            <p className="text-sm text-white/30">No hire requests yet. Discover photographers to send your first request.</p>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 3).map(r => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-lenz-card2 shrink-0">
                    {r.photographerAvatar ? <img src={r.photographerAvatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gold/40 text-xs font-bold">{r.photographerName[0]}</div>}
                  </div>
                  <div className="flex-1 min-w-0"><p className="text-sm text-white truncate">{r.photographerName}</p><p className="text-xs text-white/35">{r.projectType}</p></div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${r.status === 'pending' ? 'bg-gold/10 text-gold' : r.status === 'accepted' ? 'bg-green-950/30 text-green-400' : 'bg-white/5 text-white/40'}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
