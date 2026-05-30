import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'wouter'
import { Mail, Lock, User, Eye, EyeOff, AtSign, CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import AppLogo from '@/components/AppLogo'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'

async function checkUsernameAvailable(username: string): Promise<boolean> {
  const uname = username.trim().toLowerCase()
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .ilike('username', uname)
  if (error) throw error
  return (count ?? 0) === 0
}

export default function SignUp() {
  const [, navigate] = useLocation()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const latestUsername = useRef('')

  useEffect(() => {
    if (username.length < 3) { setUsernameStatus('idle'); return }
    setUsernameStatus('checking')
    latestUsername.current = username
    const timer = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(username)
        if (latestUsername.current !== username) return
        setUsernameStatus(available ? 'available' : 'taken')
      } catch {
        if (latestUsername.current !== username) return
        setUsernameStatus('error')
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [username])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Please enter your name'); return }
    if (username.length < 3) { toast.error('Username must be at least 3 characters'); return }
    if (usernameStatus === 'taken') { toast.error('That username is already taken'); return }
    if (usernameStatus === 'checking') { toast.error('Please wait — checking username'); return }
    if (usernameStatus === 'error') { toast.error('Could not verify username, try again'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (!agreedToTerms) { toast.error('Please agree to the Terms of Service'); return }

    setLoading(true)

    // Final username double-check
    try {
      const available = await checkUsernameAvailable(username)
      if (!available) {
        setUsernameStatus('taken')
        toast.error('That username was just taken')
        setLoading(false)
        return
      }
    } catch {
      toast.error('Could not verify username. Please try again.')
      setLoading(false)
      return
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: name.trim(), username: username.toLowerCase().trim() },
      },
    })

    if (authError) {
      toast.error(authError.message)
      setLoading(false)
      return
    }

    // Create profile immediately — even before email confirmation
    if (authData.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        username: username.toLowerCase().trim(),
        name: name.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    }

    setLoading(false)
    setDone(true)
  }

  const UsernameIndicator = () => {
    if (username.length < 3) return null
    if (usernameStatus === 'checking') return <Loader size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 animate-spin" />
    if (usernameStatus === 'available') return <CheckCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
    if (usernameStatus === 'taken') return <XCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400" />
    if (usernameStatus === 'error') return <AlertCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-400" />
    return null
  }

  const inputClass = "w-full bg-lenz-card border border-lenz-border rounded-xl py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
  const submitDisabled = loading || usernameStatus === 'taken' || usernameStatus === 'checking' || usernameStatus === 'error' || !agreedToTerms

  // Success screen — check your email
  if (done) {
    return (
      <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
        <div className="flex flex-col items-center gap-5 text-center max-w-xs">
          <AppLogo className="h-12" />
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mt-2">
            <Mail size={28} className="text-gold" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg tracking-wide">Check your email</h2>
            <p className="text-white/40 text-sm mt-2 leading-relaxed">
              We sent a confirmation link to<br />
              <span className="text-white/70 font-medium">{email}</span>
            </p>
            <p className="text-white/30 text-xs mt-3 leading-relaxed">
              Click the link in the email to activate your account, then sign in below.
            </p>
          </div>
          <button
            onClick={() => navigate('/auth/login')}
            className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider mt-2"
          >
            Go to Sign In
          </button>
          <p className="text-xs text-white/20">Didn't get it? Check your spam folder.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="mb-7 text-center flex flex-col items-center gap-2">
        <AppLogo className="h-14" />
        <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase">Join the Photography Community</p>
      </div>

      <form onSubmit={handleSignUp} className="w-full max-w-sm space-y-3.5" autoComplete="on">

        {/* Name */}
        <div className="relative">
          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text" name="name" placeholder="Full Name" value={name}
            onChange={e => setName(e.target.value)} required autoComplete="name"
            className={`${inputClass} pl-11 pr-4`}
          />
        </div>

        {/* Username */}
        <div className="space-y-1">
          <div className="relative">
            <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text" placeholder="Username" value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
              required
              className={`${inputClass} pl-11 pr-11 ${usernameStatus === 'available' ? 'border-emerald-500/50' : usernameStatus === 'taken' ? 'border-red-500/50' : ''}`}
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
            type="email" name="email" placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)} required autoComplete="email"
            autoCapitalize="none" autoCorrect="off"
            className={`${inputClass} pl-11 pr-4`}
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type={showPassword ? 'text' : 'password'} name="password"
            placeholder="Password (min 6 characters)" value={password}
            onChange={e => setPassword(e.target.value)} required autoComplete="new-password"
            className={`${inputClass} pl-11 pr-11`}
          />
          <button
            type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3 py-1">
          <button
            type="button" onClick={() => setAgreedToTerms(!agreedToTerms)}
            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${agreedToTerms ? 'bg-gold border-gold' : 'border-lenz-border'}`}
          >
            {agreedToTerms && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="#080808" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <p className="text-[11px] text-white/40 leading-relaxed">
            I am 18+ and agree to LENZLY's{' '}
            <Link href="/terms"><span className="text-gold cursor-pointer">Terms of Service</span></Link>
            {' '}and{' '}
            <Link href="/privacy"><span className="text-gold cursor-pointer">Privacy Policy</span></Link>.
            I am solely responsible for all content I post.
          </p>
        </div>

        <button
          type="submit" disabled={submitDisabled}
          className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Join LENZLY Free'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-white/30">
          Already have an account?{' '}
          <Link href="/auth/login"><span className="text-gold font-medium cursor-pointer">Sign in</span></Link>
        </p>
      </div>
    </div>
  )
}
