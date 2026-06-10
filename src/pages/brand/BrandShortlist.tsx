import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, Bookmark, MapPin, X } from 'lucide-react'
import { useBrandAuth } from '@/contexts/BrandAuthContext'
import { toast } from 'sonner'

interface Photographer {
  id: string; name: string; username: string; avatar_url: string | null
  specialty: string[]; location: string | null; available: boolean; price_range: string | null
}

export default function BrandShortlist() {
  const { api } = useBrandAuth()
  const [, navigate] = useLocation()
  const [list, setList] = useState<Photographer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/shortlist').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setList(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function remove(id: string) {
    await api(`/shortlist/${id}`, { method: 'DELETE' })
    setList(prev => prev.filter(p => p.id !== id))
    toast.success('Removed from shortlist')
  }

  return (
    <div className="min-h-screen bg-[#060606]">
      <header className="sticky top-0 z-40 bg-[#060606]/95 backdrop-blur border-b border-[#1A1A1A] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/brand-portal')} className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-white">My Shortlist</h1>
          {list.length > 0 && <span className="text-xs text-white/30">{list.length}</span>}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-[#C9A84C]/25 border-t-[#C9A84C] animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No photographers shortlisted yet</p>
            <button onClick={() => navigate('/brand-portal/search')} className="mt-4 px-5 py-2.5 rounded-xl bg-[#C9A84C] text-[#060606] text-sm font-bold">
              Discover Talent
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(p => (
              <div key={p.id} className="bg-[#0E0E0E] border border-[#1A1A1A] rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/5 overflow-hidden shrink-0">
                  {p.avatar_url
                    ? <img src={p.avatar_url} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white/20 font-bold">{p.name?.[0]}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{p.name}</span>
                    {p.available && <span className="text-[9px] font-bold text-green-400 bg-green-950/30 border border-green-500/20 px-1.5 py-0.5 rounded-full">Available</span>}
                  </div>
                  <p className="text-xs text-white/40">@{p.username}</p>
                  {p.specialty?.length > 0 && <p className="text-xs text-[#C9A84C]/60 mt-0.5">{p.specialty.slice(0, 2).join(' · ')}</p>}
                  {p.location && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-white/25" />
                      <span className="text-xs text-white/30">{p.location}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => navigate(`/brand-portal/hire/${p.id}`)}
                    className="text-[11px] font-bold text-[#060606] bg-[#C9A84C] px-3 py-1.5 rounded-lg">
                    Hire
                  </button>
                  <button onClick={() => remove(p.id)} className="p-1.5 text-white/20 hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
