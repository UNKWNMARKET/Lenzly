import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Trash2, ExternalLink, RefreshCw } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { toast } from 'sonner'

interface BrandApp {
  id: string
  company: string
  email: string
  website: string
  needs: string[]
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedAt?: string
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-yellow-400/80 bg-yellow-950/30',
  approved: 'text-green-400/80 bg-green-950/30',
  rejected: 'text-red-400/80 bg-red-950/30',
}

export default function AdminBrands() {
  const { api } = useAdminAuth()
  const [brands, setBrands] = useState<BrandApp[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  async function load() {
    setLoading(true)
    const res = await api('/brands')
    if (res.ok) setBrands(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    const res = await api(`/brands/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const data = await res.json()
      setBrands(prev => prev.map(b => b.id === id ? { ...b, status } : b))
      if (status === 'approved' && data.tempPassword) {
        // Show credentials to admin so they can share with the brand
        toast.success(
          `Approved! Login credentials:\nEmail: ${data.email}\nTemp password: ${data.tempPassword}`,
          { duration: 15000 }
        )
      } else {
        toast.success(`Application ${status}`)
      }
    }
  }

  async function deleteBrand(id: string) {
    const res = await api(`/brands/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setBrands(prev => prev.filter(b => b.id !== id))
      toast.success('Application deleted')
    }
  }

  const filtered = filter === 'all' ? brands : brands.filter(b => b.status === filter)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Brand Applications</h1>
          <p className="text-xs text-white/40 mt-0.5">{brands.length} total applications</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              filter === f
                ? 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/25'
                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            {f}
            {f !== 'all' && (
              <span className="ml-1.5 opacity-60">
                {brands.filter(b => b.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/30 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">No applications</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <div key={b.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">{b.company}</h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[b.status]}`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{b.email}</p>
                  {b.website && (
                    <a
                      href={`https://${b.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#C9A84C]/70 hover:text-[#C9A84C] flex items-center gap-1 mt-0.5 w-fit"
                    >
                      {b.website} <ExternalLink size={10} />
                    </a>
                  )}
                  {b.needs?.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {b.needs.map(n => (
                        <span key={n} className="text-[10px] bg-white/5 text-white/50 px-2 py-0.5 rounded-md">
                          {n}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-white/25 mt-2">
                    Applied {new Date(b.createdAt).toLocaleDateString()}
                    {b.reviewedAt && ` · Reviewed ${new Date(b.reviewedAt).toLocaleDateString()}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {b.status !== 'approved' && (
                    <button
                      onClick={() => updateStatus(b.id, 'approved')}
                      className="p-1.5 rounded-lg text-green-500/60 hover:text-green-400 hover:bg-green-950/20 transition-all"
                      title="Approve"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                  {b.status !== 'rejected' && (
                    <button
                      onClick={() => updateStatus(b.id, 'rejected')}
                      className="p-1.5 rounded-lg text-red-500/60 hover:text-red-400 hover:bg-red-950/20 transition-all"
                      title="Reject"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteBrand(b.id)}
                    className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-950/20 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
