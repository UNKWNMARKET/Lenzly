import { useState } from 'react'
import { Camera, Eye, EyeOff, Lock, User } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

export default function AdminLogin() {
  const { login } = useAdminAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await login(username, password)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#A88A35] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#C9A84C]/20">
            <Camera size={30} className="text-[#080808]" />
          </div>
          <h1 className="text-3xl font-bold tracking-[0.15em] bg-gradient-to-r from-[#C9A84C] to-[#E2C170] bg-clip-text text-transparent">
            LENZLY
          </h1>
          <p className="text-sm text-white/30 mt-1 tracking-widest uppercase">Admin Console</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/40 tracking-widest uppercase mb-2">
              Username
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
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
            disabled={loading || !username || !password}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E2C170] text-[#080808] font-bold text-sm tracking-wide transition-opacity disabled:opacity-40"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-white/20 mt-6">
          LENZLY Admin Console
        </p>
      </div>
    </div>
  )
}
