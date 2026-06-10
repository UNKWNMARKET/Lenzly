import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.email?.toLowerCase() === 'eisdorferjesse@gmail.com') navigate('/admin', { replace: true })
  }, [user, navigate])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }
    if (data.user?.email?.toLowerCase() !== 'eisdorferjesse@gmail.com') {
      await supabase.auth.signOut()
      setError('Access denied. Admin only.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gold/5 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="badge mb-5 mx-auto"><ShieldCheck size={11} /> Admin Portal</div>
          <h1 className="text-2xl font-serif text-white mb-1">Admin Access</h1>
          <p className="text-sm text-white/35">Sign in to manage brand applications</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input type="email" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50" />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50" />
            <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <div className="bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gold text-lenz-bg font-semibold text-sm disabled:opacity-50 hover:opacity-90 shadow-lg shadow-gold/20">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
