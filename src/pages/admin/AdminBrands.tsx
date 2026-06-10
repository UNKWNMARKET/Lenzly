import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Trash2, ExternalLink, RefreshCw, Copy, Key, X } from 'lucide-react'
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

interface Credentials {
  company: string
  email: string
  password: string
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
  const [credentials, setCredentials] = useState<Credentials | null>(null)

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
        const brand = brands.find(b => b.id === id)
        setCredentials({
          company: brand?.company ?? data.company,
          email: brand?.email ?? data.email,
          password: data.tempPassword,
        })
      } else {
        toast.success(`Application ${status}`)
      }
    }
  }

  async function deleteBrand(id: string) {
    if (!confirm('Delete this application?')) return
    const res = await api(`/brands/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setBrands(prev => prev.filter(b => b.id !== id))
      toast.success('Application deleted')
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`))
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

      {/* Credentials modal */}
      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-[#C9A84C]" />
                <h2 className="text-base font-bold text-white">Brand Approved!</h2>
              </div>
              <button onClick={() => setCredentials(null)} className="text-white/30 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-white/40 mb-4">
              Share these login credentials with <span className="text-white/70">{credentials.company}</span>. The password is generated once — copy it now.
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-1.5">Login URL</p>
                <div className="flex items-center justify-between bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl px-3 py-2.5">
                  <span className="text-xs text-white/60 font-mono">lenzly.app/brand/login</span>
                  <button onClick={() => copyToClipboard('lenzly.app/brand/login', 'URL')} className="text-white/30 hover:text-[#C9A84C] transition-colors">
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-1.5">Email</p>
                <div className="flex items-center justify-between bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl px-3 py-2.5">
                  <span className="text-xs text-white/60 font-mono">{credentials.email}</span>
                  <button onClick={() => copyToClipboard(credentials.email, 'Email')} className="text-white/30 hover:text-[#C9A84C] transition-colors">
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-1.5">Temp Password</p>
                <div className="flex items-center justify-between bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl px-3 py-2.5">
                  <span className="text-sm text-[#C9A84C] font-mono font-bold tracking-widest">{credentials.password}</span>
                  <button onClick={() => copyToClipboard(credentials.password, 'Password')} className="text-white/30 hover:text-[#C9A84C] transition-colors">
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const text = `LENZLY Brand Portal\nLogin: lenzly.app/brand/login\nEmail: ${credentials.email}\nPassword: ${credentials.password}`
                copyToClipboard(text, 'All credentials')
              }}
              className="w-full mt-4 py-2.5 rounded-xl bg-[#C9A84C]/15 border border-[#C9A84C]/25 text-[#C9A84C] text-xs font-semibold tracking-wide hover:bg-[#C9A84C]/25 transition-all"
            >
              Copy All Credentials
            </button>

            <button
              onClick={() => setCredentials(null)}
              className="w-full mt-2 py-2.5 rounded-xl bg-white/5 text-white/40 text-xs font-semibold hover:bg-white/10 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
