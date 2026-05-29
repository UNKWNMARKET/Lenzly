import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Mail, Lock, User, Eye, EyeOff, AtSign, CheckCircle, XCircle, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import AppLogo from '@/components/AppLogo'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken'

export default function SignUp() {
  const [, navigate] = useLocation()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')

  // Debounced username availability check
  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus('idle')
      return
    }

    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle()

      setUsernameStatus(data ? 'taken' : 'available')
    }, 400)

    return () => clearTimeout(timer)
  }, [username])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (usernameStatus === 'taken') {
      toast.error('That username is already taken')
      return
    }
    if (usernameStatus === 'checking') {
      toast.error('Please wait while we check your username')
      return
    }
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, username },
      },
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Account created! Welcome to LENZLY.')
      navigate('/')
    }
    setLoading(false)
  }

  // Username status icon
  const UsernameIndicator = () => {
    if (username.length < 3) return null
    if (usernameStatus === 'checking') {
      return <Loader size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 animate-spin" />
    }
    if (usernameStatus === 'available') {
      return <CheckCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
    }
    if (usernameStatus === 'taken') {
      return <XCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400" />
    }
    return null
  }

  const submitDisabled = loading || usernameStatus === 'taken' || usernameStatus === 'checking'

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      {/* Logo */}
      <div className="mb-8 text-center flex flex-col items-center gap-2">
        <AppLogo className="h-14" />
        <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase">Join the Photography Community</p>
      </div>

      <form onSubmit={handleSignUp} className="w-full max-w-sm space-y-3.5">
        {/* Full name */}
        <div className="relative">
          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        {/* Username */}
        <div className="space-y-1">
          <div className="relative">
            <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
              required
              className={`w-full bg-lenz-card border rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-white/25 outline-none transition-colors ${
                usernameStatus === 'available'
                  ? 'border-emerald-500/50 focus:border-emerald-400'
                  : usernameStatus === 'taken'
                  ? 'border-red-500/50 focus:border-red-400'
                  : 'border-lenz-border focus:border-gold/50'
              }`}
            />
            <UsernameIndicator />
          </div>
          {usernameStatus === 'available' && username.length >= 3 && (
            <p className="text-[11px] text-emerald-400 pl-1">@{username} is available</p>
          )}
          {usernameStatus === 'taken' && (
            <p className="text-[11px] text-red-400 pl-1">@{username} is already taken</p>
          )}
        </div>

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
            placeholder="Password (min 6 chars)"
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

        <p className="text-[10px] text-white/20 leading-relaxed">
          By joining you agree to our{' '}
          <Link href="/terms"><span className="text-gold/60 cursor-pointer">Terms</span></Link>
          {' '}and{' '}
          <Link href="/privacy"><span className="text-gold/60 cursor-pointer">Privacy Policy</span></Link>.
          Free to join. Pro features available for $5/month.
        </p>

        <button
          type="submit"
          disabled={submitDisabled}
          className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Join LENZLY Free'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-white/30">
          Already have an account?{' '}
          <Link href="/auth/login">
            <span className="text-gold hover:text-gold/80 font-medium cursor-pointer">Sign in</span>
          </Link>
        </p>
      </div>
    </div>
  )
}
