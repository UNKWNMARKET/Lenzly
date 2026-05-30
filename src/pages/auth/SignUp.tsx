import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'wouter'
import { Mail, Lock, User, Eye, EyeOff, AtSign, CheckCircle, XCircle, Loader, AlertCircle, Phone, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import AppLogo from '@/components/AppLogo'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'
type Method = 'email' | 'phone'
type Step = 'form' | 'verify'

async function checkUsernameAvailable(username: string): Promise<boolean> {
  const uname = username.trim().toLowerCase()
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .ilike('username', uname)
  if (error) throw error
  return (count ?? 0) === 0
}

function formatPhone(raw: string): string {
  // Strip everything except digits and leading +
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return ''
  return '+1' + digits.slice(-10) // default US — adjust if needed
}

export default function SignUp() {
  const [, navigate] = useLocation()
  const [method, setMethod] = useState<Method>('email')
  const [step, setStep] = useState<Step>('form')

  // Form fields
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // OTP verification
  const [otp, setOtp] = useState('')
  const [otpRefs] = useState(() => Array.from({ length: 6 }, () => ({ current: null as HTMLInputElement | null })))

  // State
  const [loading, setLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const latestUsername = useRef('')

  // Pending phone number for OTP verification
  const pendingPhone = useRef('')
  const pendingEmail = useRef('')

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

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Please enter your name'); return }
    if (username.length < 3) { toast.error('Username must be at least 3 characters'); return }
    if (usernameStatus === 'taken') { toast.error('That username is already taken'); return }
    if (usernameStatus === 'checking') { toast.error('Please wait — checking username'); return }
    if (usernameStatus === 'error') { toast.error('Could not verify username, try again'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (!agreedToTerms) { toast.error('Please agree to the Terms of Service'); return }

    setLoading(true)
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
      email,
      password,
      options: { data: { name, username: username.toLowerCase().trim() } },
    })

    if (authError) { toast.error(authError.message); setLoading(false); return }

    if (authData.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        username: username.toLowerCase().trim(),
        name: name.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    }

    toast.success('Welcome to LENZLY! Set up your profile.')
    navigate('/profile/edit')
    setLoading(false)
  }

  const handlePhoneSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Please enter your name'); return }
    if (username.length < 3) { toast.error('Username must be at least 3 characters'); return }
    if (usernameStatus === 'taken') { toast.error('That username is already taken'); return }
    if (usernameStatus === 'checking') { toast.error('Please wait — checking username'); return }
    if (!phone.trim()) { toast.error('Please enter your phone number'); return }
    if (!agreedToTerms) { toast.error('Please agree to the Terms of Service'); return }

    setLoading(true)
    try {
      const available = await checkUsernameAvailable(username)
      if (!available) { setUsernameStatus('taken'); toast.error('That username was just taken'); setLoading(false); return }
    } catch {
      toast.error('Could not verify username. Try again.')
      setLoading(false)
      return
    }

    const formatted = formatPhone(phone)
    if (formatted.length < 12) { toast.error('Enter a valid 10-digit US phone number'); setLoading(false); return }

    const { error } = await supabase.auth.signInWithOtp({
      phone: formatted,
      options: { data: { name, username: username.toLowerCase().trim() } },
    })

    if (error) { toast.error(error.message); setLoading(false); return }

    pendingPhone.current = formatted
    toast.success(`Code sent to ${formatted}`)
    setStep('verify')
    setLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) { toast.error('Enter the 6-digit code'); return }
    setLoading(true)

    const { data, error } = await supabase.auth.verifyOtp({
      phone: pendingPhone.current,
      token: otp,
      type: 'sms',
    })

    if (error) { toast.error('Invalid code — please try again'); setLoading(false); return }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: username.toLowerCase().trim(),
        name: name.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    }

    toast.success('Welcome to LENZLY! Set up your profile.')
    navigate('/profile/edit')
    setLoading(false)
  }

  const handleOtpInput = (val: string, idx: number) => {
    const digits = val.replace(/\D/g, '').slice(0, 1)
    const arr = otp.split('')
    arr[idx] = digits
    const next = arr.join('').slice(0, 6)
    setOtp(next.padEnd(6, '').slice(0, 6))
    if (digits && idx < 5) {
      const nextRef = otpRefs[idx + 1]
      nextRef?.current?.focus()
    }
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

  // OTP verification screen
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
        <button onClick={() => setStep('form')} className="absolute top-14 left-5 p-2 text-white/50">
          <ArrowLeft size={22} />
        </button>
        <div className="mb-8 text-center">
          <AppLogo className="h-12 mx-auto" />
          <p className="text-white font-semibold mt-6 text-base">Verify your number</p>
          <p className="text-white/40 text-sm mt-1">Enter the 6-digit code sent to<br />{pendingPhone.current}</p>
        </div>

        <form onSubmit={handleVerifyOtp} className="w-full max-w-sm space-y-6">
          <div className="flex justify-center gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                ref={el => { otpRefs[i].current = el }}
                type="tel"
                maxLength={1}
                value={otp[i] || ''}
                onChange={e => handleOtpInput(e.target.value, i)}
                onKeyDown={e => {
                  if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs[i - 1].current?.focus()
                }}
                className="w-12 h-14 text-center text-xl font-bold bg-lenz-card border border-lenz-border rounded-2xl text-white outline-none focus:border-gold/60 transition-colors"
              />
            ))}
          </div>

          <button type="submit" disabled={loading || otp.replace(/\s/g, '').length < 6}
            className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50">
            {loading ? 'Verifying…' : 'Verify & Join'}
          </button>

          <button type="button" onClick={handlePhoneSignUp}
            className="w-full text-center text-sm text-white/30 hover:text-white/50 transition-colors">
            Didn't get a code? Resend
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="mb-6 text-center flex flex-col items-center gap-2">
        <AppLogo className="h-14" />
        <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase">Join the Photography Community</p>
      </div>

      {/* Email / Phone toggle */}
      <div className="flex w-full max-w-sm bg-lenz-card rounded-2xl p-1 mb-5 border border-lenz-border">
        {(['email', 'phone'] as Method[]).map(m => (
          <button key={m} type="button" onClick={() => setMethod(m)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${method === m ? 'bg-gold text-lenz-bg shadow' : 'text-white/40 hover:text-white/60'}`}>
            {m === 'email' ? <Mail size={15} /> : <Phone size={15} />}
            {m === 'email' ? 'Email' : 'Phone'}
          </button>
        ))}
      </div>

      <form onSubmit={method === 'email' ? handleEmailSignUp : handlePhoneSignUp}
        className="w-full max-w-sm space-y-3.5" autoComplete="on">

        {/* Name */}
        <div className="relative">
          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" name="name" placeholder="Full Name" value={name}
            onChange={e => setName(e.target.value)} required autoComplete="name"
            className={`${inputClass} pl-11 pr-4`} />
        </div>

        {/* Username */}
        <div className="space-y-1">
          <div className="relative">
            <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="text" placeholder="Username" value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
              required
              className={`${inputClass} pl-11 pr-11 ${usernameStatus === 'available' ? 'border-emerald-500/50' : usernameStatus === 'taken' ? 'border-red-500/50' : ''}`} />
            <UsernameIndicator />
          </div>
          {usernameStatus === 'available' && username.length >= 3 && <p className="text-[11px] text-emerald-400 pl-1">@{username} is available</p>}
          {usernameStatus === 'taken' && <p className="text-[11px] text-red-400 pl-1">@{username} is already taken</p>}
        </div>

        {/* Email or Phone */}
        {method === 'email' ? (
          <>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="email" name="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)} required autoComplete="email"
                autoCapitalize="none" autoCorrect="off"
                className={`${inputClass} pl-11 pr-4`} />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input type={showPassword ? 'text' : 'password'} name="password"
                placeholder="Password (min 6 chars)" value={password}
                onChange={e => setPassword(e.target.value)} required autoComplete="new-password"
                className={`${inputClass} pl-11 pr-11`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </>
        ) : (
          <div className="relative">
            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="tel" name="phone" placeholder="Phone number (US)" value={phone}
              onChange={e => setPhone(e.target.value)} required autoComplete="tel"
              className={`${inputClass} pl-11 pr-4`} />
          </div>
        )}

        {/* Terms */}
        <div className="flex items-start gap-3 py-1">
          <button type="button" onClick={() => setAgreedToTerms(!agreedToTerms)}
            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${agreedToTerms ? 'bg-gold border-gold' : 'border-lenz-border'}`}>
            {agreedToTerms && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#080808" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>
          <p className="text-[11px] text-white/40 leading-relaxed">
            I am 18+ and agree to LENZLY's{' '}
            <Link href="/terms"><span className="text-gold cursor-pointer">Terms of Service</span></Link>
            {' '}and{' '}
            <Link href="/privacy"><span className="text-gold cursor-pointer">Privacy Policy</span></Link>.
            I am solely responsible for all content I post.
          </p>
        </div>

        <button type="submit" disabled={submitDisabled}
          className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50">
          {loading ? (method === 'phone' ? 'Sending code…' : 'Creating account…') : (method === 'phone' ? 'Send Verification Code' : 'Join LENZLY Free')}
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
