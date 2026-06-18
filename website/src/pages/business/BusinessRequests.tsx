import { Send, Calendar, DollarSign, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useHireRequests } from '../../hooks/useBusiness'

export default function BusinessRequests() {
  const { requests, cancel } = useHireRequests()
  const active = requests.filter(r => r.status !== 'cancelled')

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6"><p className="section-label mb-2">Hire Requests</p><h1 className="text-3xl font-serif text-white mb-2">Your requests.</h1><p className="text-sm text-white/40">Track the status of every hire request you've sent.</p></div>
      {active.length === 0 ? (
        <div className="text-center py-24"><Send size={32} className="text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm mb-5">No hire requests yet</p><Link to="/business/discover" className="btn-gold inline-flex">Discover photographers</Link></div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className={`card-premium p-5 ${r.status === 'cancelled' ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-lenz-card2 shrink-0">
                  {r.photographerAvatar ? <img src={r.photographerAvatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gold/40 font-bold">{r.photographerName[0]}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-white">{r.photographerName}</h3>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${r.status === 'pending' ? 'bg-gold/10 text-gold' : r.status === 'accepted' ? 'bg-green-950/30 text-green-400' : r.status === 'declined' ? 'bg-red-950/30 text-red-400' : 'bg-white/5 text-white/40'}`}>{r.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-white/40 mb-2">
                    <span className="flex items-center gap-1"><Send size={11} className="text-gold/50" />{r.projectType}</span>
                    {r.budget && <span className="flex items-center gap-1"><DollarSign size={11} className="text-gold/50" />{r.budget}</span>}
                    {r.date && <span className="flex items-center gap-1"><Calendar size={11} className="text-gold/50" />{r.date}</span>}
                  </div>
                  {r.message && <p className="text-sm text-white/55 leading-relaxed">{r.message}</p>}
                  {r.status === 'pending' && <button onClick={() => cancel(r.id)} className="mt-3 text-xs text-white/30 hover:text-red-400 flex items-center gap-1"><X size={12} /> Cancel request</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
