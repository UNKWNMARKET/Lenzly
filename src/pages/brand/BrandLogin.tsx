import { useState } from 'react'
import { useLocation } from 'wouter'
import { Building2, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useBrandAuth } from '@/contexts/BrandAuthContext'

export default function BrandLogin() {
  const { login } = useBrandAuth()
  const [, navigate] = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await login(email.trim(), password)
    setLoading(false)
    if (err) { setError(err); return }
    navigate('/brand-portal')
  }

  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-[#C9A84C]" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest">LENZLY</h1>
          <p className="text-xs text-[#C9A84C] tracking-[0.3em] mt-1 uppercase">Brand Portal</p>
        </div>

        <div className="bg-[#0E0E0E] border border-[#1A1A1A] rounded-3xl p-8">
          <h2 className="text-lg font-bold text-white mb-1">Welcome back</h2>
          <p className="text-sm text-white/40 mb-7">Sign in to your brand account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Work Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full bg-[#141414] border border-[#222] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#141414] border border-[#222] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#C9A84C] text-[#060606] font-bold text-sm tracking-wider disabled:opacity-50 active:scale-[0.98] transition-transform mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#1A1A1A] text-center">
            <p className="text-xs text-white/30">
              Don't have access?{' '}
              <button onClick={() => navigate('/brands')} className="text-[#C9A84C] hover:underline">
                Apply for brand access
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
