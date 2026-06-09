import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (user) navigate('/app') }, [user, navigate])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gold/5 blur-[120px] pointer-events-none" />
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Home
      </Link>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="text-2xl font-black tracking-[0.3em] gold-text">LENZLY</span>
          <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase mt-3">Photography Platform</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors" />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors" />
            <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <div className="bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gold text-lenz-bg font-semibold text-sm tracking-wide disabled:opacity-50 hover:opacity-90 transition-all shadow-lg shadow-gold/20">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-white/30 mt-6">
          Don't have an account? <Link to="/signup" className="text-gold hover:text-gold/80 font-medium">Join free</Link>
        </p>
        <p className="text-center text-xs text-white/20 mt-4">
          Are you a business? <Link to="/business/login" className="text-white/40 hover:text-gold">Business sign in</Link>
        </p>
      </div>
    </div>
  )
}
