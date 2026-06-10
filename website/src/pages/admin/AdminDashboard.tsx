import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, Copy, LogOut, Building2, Globe, Mail, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface Application {
  id: string
  company: string
  email: string
  website: string | null
  needs: string[]
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
  temp_password: string | null
}

interface Credentials { company: string; email: string; password: string }

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let p = ''
  for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)]
  return p + '!'
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/login?next=/admin')
    else if (!authLoading && user?.email !== 'eisdorferjesse@gmail.com') navigate('/')
  }, [user, authLoading, navigate])

  const fetchApps = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('brand_applications')
      .select('*')
      .order('created_at', { ascending: false })
    setApps((data as Application[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { if (user?.email === 'eisdorferjesse@gmail.com') fetchApps() }, [user, fetchApps])

  async function approve(app: Application) {
    setActionLoading(app.id)
    const tempPassword = generatePassword()

    // Update application status (brand account created via Supabase invite email)
    await supabase
      .from('brand_applications')
      .update({
        status: 'approved',
        temp_password: tempPassword,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', app.id)

    setCredentials({ company: app.company, email: app.email, password: tempPassword })
    await fetchApps()
    setActionLoading(null)
  }

  async function reject(app: Application) {
    setActionLoading(app.id)
    await supabase
      .from('brand_applications')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', app.id)
    await fetchApps()
    setActionLoading(null)
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function copyAll(creds: Credentials) {
    const text = `Lenzly Business Portal\nCompany: ${creds.company}\nEmail: ${creds.email}\nPassword: ${creds.password}\nLogin: ${window.location.origin}/business/login`
    copy(text, 'all')
  }

  const filtered = apps.filter(a => a.status === tab)

  if (authLoading) return <div className="min-h-screen bg-lenz-bg" />

  return (
    <div className="min-h-screen bg-lenz-bg">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-lenz-border glass sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl text-white">Lenzly</span>
            <span className="badge">Admin</span>
          </div>
          <button onClick={() => supabase.auth.signOut().then(() => navigate('/admin/login'))}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif text-white mb-1">Brand Applications</h1>
            <p className="text-sm text-white/35">Review and manage brand access requests</p>
          </div>
          <button onClick={fetchApps} className="flex items-center gap-2 text-sm text-white/40 hover:text-gold transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-lenz-card border border-lenz-border rounded-xl p-1 w-fit">
          {(['pending', 'approved', 'rejected'] as const).map(t => {
            const count = apps.filter(a => a.status === t).length
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize flex items-center gap-2 ${tab === t ? 'bg-gold text-lenz-bg' : 'text-white/40 hover:text-white'}`}>
                {t === 'pending' && <Clock size={13} />}
                {t === 'approved' && <CheckCircle size={13} />}
                {t === 'rejected' && <XCircle size={13} />}
                {t} {count > 0 && <span className={`text-xs rounded-full px-1.5 py-0.5 ${tab === t ? 'bg-lenz-bg/20' : 'bg-white/10'}`}>{count}</span>}
              </button>
            )
          })}
        </div>

        {/* Applications list */}
        {loading ? (
          <div className="text-center py-16 text-white/30">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">No {tab} applications</div>
        ) : (
          <div className="space-y-4">
            {filtered.map(app => (
              <div key={app.id} className="card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                        <Building2 size={16} className="text-gold" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{app.company}</h3>
                        <p className="text-xs text-white/35">{new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="ml-12 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-white/50">
                        <Mail size={12} className="text-white/25" /> {app.email}
                      </div>
                      {app.website && (
                        <div className="flex items-center gap-2 text-sm text-white/50">
                          <Globe size={12} className="text-white/25" /> {app.website}
                        </div>
                      )}
                      {app.needs?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {app.needs.map(n => (
                            <span key={n} className="text-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-white/40">{n}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {tab === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => reject(app)} disabled={actionLoading === app.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-colors disabled:opacity-40">
                        <XCircle size={14} /> Reject
                      </button>
                      <button onClick={() => approve(app)} disabled={actionLoading === app.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold text-lenz-bg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40">
                        <CheckCircle size={14} /> Approve
                      </button>
                    </div>
                  )}

                  {tab === 'approved' && app.temp_password && (
                    <button onClick={() => setCredentials({ company: app.company, email: app.email, password: app.temp_password! })}
                      className="shrink-0 text-xs text-gold/60 hover:text-gold transition-colors border border-gold/20 rounded-lg px-3 py-2">
                      View Credentials
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Credentials Modal */}
      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCredentials(null)} />
          <div className="relative bg-lenz-card border border-gold/20 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-gold/10">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={22} className="text-gold" />
              </div>
              <h2 className="text-xl font-serif text-white mb-1">Access Granted</h2>
              <p className="text-sm text-white/35">{credentials.company} can now log in to the business portal</p>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: 'Login URL', value: `${window.location.origin}/business/login`, key: 'url' },
                { label: 'Email', value: credentials.email, key: 'email' },
                { label: 'Temp Password', value: credentials.password, key: 'pass' },
              ].map(({ label, value, key }) => (
                <div key={key} className="flex items-center justify-between gap-3 bg-black/30 border border-white/8 rounded-xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs text-white/30 mb-0.5">{label}</p>
                    <p className="text-sm text-white font-mono truncate">{value}</p>
                  </div>
                  <button onClick={() => copy(value, key)} className="shrink-0 text-white/30 hover:text-gold transition-colors">
                    {copied === key ? <CheckCircle size={15} className="text-gold" /> : <Copy size={15} />}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => copyAll(credentials)}
                className="flex-1 py-3 rounded-xl border border-gold/30 text-gold text-sm font-medium hover:bg-gold/10 transition-colors flex items-center justify-center gap-2">
                {copied === 'all' ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy All</>}
              </button>
              <button onClick={() => setCredentials(null)}
                className="flex-1 py-3 rounded-xl bg-gold text-lenz-bg text-sm font-semibold hover:opacity-90 transition-opacity">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
