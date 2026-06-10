import { useState } from 'react'
import { Building2, Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react'
import { useLocation } from 'wouter'
import { useBrandAuth } from '@/contexts/BrandAuthContext'

export default function BrandLogin() {
  const { login, brand } = useBrandAuth()
  const [, navigate] = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already logged in
  if (brand) {
    navigate('/brand/dashboard')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await login(email, password)
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      navigate('/brand/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Back link */}
        <button
          onClick={() => navigate('/brands')}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to Brands
        </button>

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#A88A35] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#C9A84C]/20">
            <Building2 size={28} className="text-[#080808]" />
          </div>
          <h1 className="text-3xl font-bold tracking-[0.15em] bg-gradient-to-r from-[#C9A84C] to-[#E2C170] bg-clip-text text-transparent">
            LENZLY
          </h1>
          <p className="text-sm text-white/30 mt-1 tracking-widest uppercase">Brand Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/40 tracking-widest uppercase mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/40 tracking-widest uppercase mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••••"
                autoComplete="current-password"
                className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E2C170] text-[#080808] font-bold text-sm tracking-wide transition-opacity disabled:opacity-40"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-white/20 mt-6">
          Don't have access?{' '}
          <button onClick={() => navigate('/brands')} className="text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors">
            Apply here
          </button>
        </p>
      </div>
    </div>
  )
}
