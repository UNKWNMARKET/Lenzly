import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, AtSign, Eye, EyeOff, ArrowLeft, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function Signup() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [usernameOk, setUsernameOk] = useState<boolean | null>(null)

  useEffect(() => { if (user) navigate('/app') }, [user, navigate])

  useEffect(() => {
    const u = form.username.toLowerCase().trim()
    if (u.length < 3) { setUsernameOk(null); return }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id').ilike('username', u).maybeSingle()
      setUsernameOk(!data)
    }, 450)
    return () => clearTimeout(t)
  }, [form.username])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (usernameOk === false) { setError('Username is taken'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name, username: form.username.toLowerCase().trim() } },
    })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: form.username.toLowerCase().trim(),
        name: form.name.trim(),
      }, { onConflict: 'id' })
    }
    setDone(true); setLoading(false)
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  if (done) return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-green-950/30 border border-green-500/20 flex items-center justify-center mb-5">
        <Check size={28} className="text-green-400" />
      </div>
      <h1 className="text-2xl font-serif text-white mb-3">Check your email</h1>
      <p className="text-sm text-white/40 max-w-xs mb-8">We sent a confirmation link to <span className="text-white">{form.email}</span>. Confirm it, then sign in.</p>
      <Link to="/login" className="btn-gold">Go to Sign In</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 relative py-12">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gold/5 blur-[120px] pointer-events-none" />
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Home
      </Link>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-2xl font-black tracking-[0.3em] gold-text">LENZLY</span>
          <p className="text-sm text-white/35 mt-3">Create your free account</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input placeholder="Full name" value={form.name} onChange={set('name')} required
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors" />
          </div>
          <div className="relative">
            <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input placeholder="Username" value={form.username} onChange={set('username')} required
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors" />
            {usernameOk !== null && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2">
                {usernameOk ? <Check size={16} className="text-green-400" /> : <X size={16} className="text-red-400" />}
              </span>
            )}
          </div>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors" />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')} required minLength={6}
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors" />
            <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <div className="bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gold text-lenz-bg font-semibold text-sm tracking-wide disabled:opacity-50 hover:opacity-90 transition-all shadow-lg shadow-gold/20">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-white/30 mt-6">
          Already have an account? <Link to="/login" className="text-gold hover:text-gold/80 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
