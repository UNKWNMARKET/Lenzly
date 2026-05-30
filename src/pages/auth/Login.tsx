import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Mail, Lock, Eye, EyeOff, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import AppLogo from '@/components/AppLogo'

const SAVED_EMAIL_KEY = 'lenzly_saved_email'
const REMEMBER_KEY    = 'lenzly_remember_me'

export default function Login() {
  const [, navigate] = useLocation()
  const { user } = useAuth()

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [rememberMe, setRememberMe]     = useState(true)

  // Restore saved email on mount
  useEffect(() => {
    const savedRemember = localStorage.getItem(REMEMBER_KEY)
    if (savedRemember === 'false') {
      setRememberMe(false)
    } else {
      const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY)
      if (savedEmail) setEmail(savedEmail)
    }
  }, [])

  // When auth state changes to logged-in, navigate once — no double-prompt
  useEffect(() => {
    if (user) navigate('/')
  }, [user])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (rememberMe) {
      localStorage.setItem(SAVED_EMAIL_KEY, email)
      localStorage.setItem(REMEMBER_KEY, 'true')
    } else {
      localStorage.removeItem(SAVED_EMAIL_KEY)
      localStorage.setItem(REMEMBER_KEY, 'false')
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      // On success we do NOT navigate here — the useEffect above handles it
      // once AuthContext confirms the session, preventing double-login
    }
  }

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      {/* Logo — full wordmark on login/signup screens */}
      <div className="mb-10 text-center flex flex-col items-center gap-3">
        <AppLogo className="h-12" />
        <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase">Photography Platform</p>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4" autoComplete="on">
        {/* Email */}
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
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

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setRememberMe(r => !r)}
            className="flex items-center gap-2.5 group"
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
              rememberMe
                ? 'bg-gold border-gold'
                : 'bg-transparent border-white/20 group-hover:border-white/40'
            }`}>
              {rememberMe && <Check size={11} className="text-lenz-bg" strokeWidth={3} />}
            </div>
            <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors select-none">
              Remember me
            </span>
          </button>
          <Link href="/auth/forgot-password">
            <span className="text-sm text-gold/70 hover:text-gold transition-colors cursor-pointer">
              Forgot password?
            </span>
          </Link>
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
