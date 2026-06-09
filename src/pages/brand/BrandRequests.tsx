import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, Send, X } from 'lucide-react'
import { useBrandAuth } from '@/contexts/BrandAuthContext'
import { toast } from 'sonner'

interface HireRequest {
  id: string
  photographerId: string
  message: string
  budget: string | null
  projectType: string | null
  startDate: string | null
  status: 'pending' | 'cancelled'
  createdAt: string
  photographer?: { id: string; name: string; username: string; avatar_url: string | null }
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-950/40 text-yellow-400 border-yellow-500/20',
  cancelled: 'bg-white/5 text-white/30 border-white/10',
}

export default function BrandRequests() {
  const { api } = useBrandAuth()
  const [, navigate] = useLocation()
  const [requests, setRequests] = useState<HireRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/hire-requests').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setRequests(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function cancel(id: string) {
    const res = await api(`/hire-requests/${id}/cancel`, { method: 'PUT' })
    if (res.ok) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r))
      toast.success('Request cancelled')
    }
  }

  return (
    <div className="min-h-screen bg-[#060606]">
      <header className="sticky top-0 z-40 bg-[#060606]/95 backdrop-blur border-b border-[#1A1A1A] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/brand-portal')} className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-white">Hire Requests</h1>
          {requests.length > 0 && <span className="text-xs text-white/30">{requests.length}</span>}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-[#C9A84C]/25 border-t-[#C9A84C] animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <Send size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No hire requests sent yet</p>
            <button onClick={() => navigate('/brand-portal/search')} className="mt-4 px-5 py-2.5 rounded-xl bg-[#C9A84C] text-[#060606] text-sm font-bold">
              Find Photographers
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className="bg-[#0E0E0E] border border-[#1A1A1A] rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden shrink-0 mt-0.5">
                    {r.photographer?.avatar_url
                      ? <img src={r.photographer.avatar_url} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white/20 font-bold text-sm">{r.photographer?.name?.[0] ?? '?'}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{r.photographer?.name ?? 'Photographer'}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {r.projectType && <span className="text-[11px] bg-white/5 text-white/50 px-2 py-0.5 rounded-md">{r.projectType}</span>}
                      {r.budget && <span className="text-[11px] text-[#C9A84C]/60">{r.budget}</span>}
                      {r.startDate && <span className="text-[11px] text-white/30">Starting {r.startDate}</span>}
                    </div>
                    <p className="text-xs text-white/50 mt-2 line-clamp-2 leading-relaxed">{r.message}</p>
                  </div>
                  {r.status === 'pending' && (
                    <button onClick={() => cancel(r.id)} className="p-1.5 text-white/20 hover:text-red-400 transition-colors shrink-0" title="Cancel">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
