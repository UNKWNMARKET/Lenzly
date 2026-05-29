import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import AppLogo from '@/components/AppLogo'

export default function Login() {
  const [, navigate] = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      {/* Logo */}
      <div className="mb-10 text-center flex flex-col items-center gap-2">
        <AppLogo className="h-14" />
        <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase">Photography Platform</p>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        {/* Email */}
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-white/30">
          Don't have an account?{' '}
          <Link href="/auth/signup">
            <span className="text-gold hover:text-gold/80 font-medium cursor-pointer">Join free</span>
          </Link>
        </p>
      </div>
    </div>
  )
}
