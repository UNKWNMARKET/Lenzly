import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'wouter'
import { Mail, Lock, Eye, EyeOff, AtSign, CheckCircle, XCircle, AlertCircle, ArrowLeft, User, ArrowRight } from 'lucide-react'
import Spinner from '@/components/Spinner'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import AppLogo from '@/components/AppLogo'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'
type Step = 0 | 1 | 2 | 3 | 4

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

async function checkUsernameAvailable(username: string): Promise<boolean> {
  const uname = username.trim().toLowerCase()
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .ilike('username', uname)
  if (error) throw error
  return (count ?? 0) === 0
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)]
  const score = checks.filter(Boolean).length
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400']
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  if (!password) return null
  return (
    <div className="space-y-1.5 mt-2 px-1">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : 'bg-white/10'}`} />
        ))}
      </div>
      <p className={`text-[11px] ${score < 2 ? 'text-red-400' : score < 4 ? 'text-yellow-400' : 'text-emerald-400'}`}>
        {labels[score - 1] ?? 'Too short'}
      </p>
    </div>
  )
}

const STEPS = ['Username', 'Verify email', 'Set password', 'Your name']

export default function SignUp() {
  const [, navigate] = useLocation()
  const [step, setStep] = useState<Step>(0)
  const [socialLoading, setSocialLoading] = useState<'apple' | 'google' | null>(null)

  const handleSocialSignup = async (provider: 'apple' | 'google') => {
    setSocialLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: 'https://lenzly.com/auth/callback' },
    })
    if (error) { toast.error(error.message); setSocialLoading(null) }
  }

  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const latestUsername = useRef('')

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [name, setName] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

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

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const fieldClass = (name: string) =>
    `w-full bg-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-white/20 outline-none border transition-all duration-200 ${
      focused === name ? 'border-gold/60 bg-white/8' : 'border-white/8 hover:border-white/15'
    }`

  const handleStep1 = async () => {
    if (username.length < 3) { toast.error('Username must be at least 3 characters'); return }
    if (usernameStatus === 'checking') { toast.error('Please wait — checking username'); return }
    if (usernameStatus === 'taken') { toast.error('That username is already taken'); return }
    if (usernameStatus === 'error') { toast.error('Could not verify username'); return }
    setLoading(true)
    try {
      const available = await checkUsernameAvailable(username)
      if (!available) { setUsernameStatus('taken'); toast.error('Username just taken, try another'); return }
    } catch { toast.error('Could not verify username'); return }
    finally { setLoading(false) }
    setStep(2)
  }

  const sendOtp = async () => {
    if (!email.trim()) { toast.error('Enter your email address'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setOtpSent(true)
    setResendCooldown(60)
    toast.success('Code sent — check your inbox')
  }

  const verifyOtp = async () => {
    if (otp.length !== 8) { toast.error('Enter the 8-digit code'); return }
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'email',
    })
    setLoading(false)
    if (error) { toast.error('Invalid or expired code — try again'); return }
    setStep(3)
  }

  const handleStep3 = async () => {
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setStep(4)
  }

  const handleStep4 = async () => {
    if (!name.trim()) { toast.error('Please enter your name'); return }
    if (!agreedToTerms) { toast.error('Please agree to the Terms of Service'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        username: username.toLowerCase().trim(),
        name: name.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    }
    setLoading(false)
    navigate('/onboarding')
  }

  return (
    <div className="min-h-screen bg-[#060606] flex flex-col safe-top safe-bottom overflow-hidden relative">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#C9A84C]/8 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[#C9A84C]/4 blur-[80px]" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10 flex flex-col items-center gap-3">
          <AppLogo className="h-11" />
          <p className="text-[10px] text-white/25 tracking-[0.45em] uppercase">Join the Community</p>
        </div>

        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-7 backdrop-blur-sm shadow-2xl">

            {/* ── STEP 0: Social sign-up ── */}
            {step === 0 && (
              <>
                <h2 className="text-white font-semibold text-lg mb-1">Create your account</h2>
                <p className="text-white/35 text-sm mb-6">Join the photography community</p>

                {/* Apple */}
                <button
                  onClick={() => handleSocialSignup('apple')}
                  disabled={!!socialLoading}
                  className="w-full mb-3 flex items-center justify-center gap-3 bg-white text-[#060606] active:scale-[0.98] rounded-2xl py-4 font-semibold text-sm transition-all duration-150 disabled:opacity-60 hover:bg-white/90"
                >
                  {socialLoading === 'apple'
                    ? <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    : <AppleIcon />}
                  Continue with Apple
                </button>

                {/* Google */}
                <button
                  onClick={() => handleSocialSignup('google')}
                  disabled={!!socialLoading}
                  className="w-full mb-4 flex items-center justify-center gap-3 bg-white/[0.06] border border-white/10 text-white active:scale-[0.98] rounded-2xl py-4 font-semibold text-sm transition-all duration-150 disabled:opacity-60 hover:bg-white/10"
                >
                  {socialLoading === 'google'
                    ? <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    : <GoogleIcon />}
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-[10px] text-white/25 tracking-widest uppercase">or</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                {/* Email sign-up */}
                <button
                  onClick={() => setStep(1)}
                  className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 active:scale-[0.98] text-[#060606] font-semibold text-sm py-4 rounded-2xl transition-all duration-150 shadow-[0_4px_20px_rgba(201,168,76,0.3)]"
                >
                  <Mail size={16} />
                  Sign up with email
                </button>
              </>
            )}

            {/* Step indicator for steps 1–4 */}
            {step > 0 && (
              <>
                <div className="flex items-center gap-1.5 mb-5">
                  {([1, 2, 3, 4] as const).map(s => (
                    <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s === step ? 'flex-[2] bg-gold' : s < step ? 'flex-1 bg-gold/30' : 'flex-1 bg-white/10'}`} />
                  ))}
                </div>
                <p className="text-white/40 text-xs tracking-wider uppercase mb-0.5">Step {step} of 4</p>
                <h2 className="text-white font-semibold text-lg mb-5">{STEPS[step - 1]}</h2>
              </>
            )}

            {/* ── STEPS 1–4 ── */}
            {step === 1 && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="relative">
                    <AtSign size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'username' ? 'text-gold/60' : 'text-white/25'}`} />
                    <input
                      type="text" placeholder="Pick a username" value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                      onFocus={() => setFocused('username')} onBlur={() => setFocused(null)}
                      autoFocus
                      className={`${fieldClass('username')} ${usernameStatus === 'available' ? 'border-emerald-500/50' : usernameStatus === 'taken' ? 'border-red-500/50' : ''} pr-12`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      {usernameStatus === 'checking' && <Spinner size="sm" />}
                      {usernameStatus === 'available' && <CheckCircle size={15} className="text-emerald-400" />}
                      {usernameStatus === 'taken' && <XCircle size={15} className="text-red-400" />}
                      {usernameStatus === 'error' && <AlertCircle size={15} className="text-yellow-400" />}
                    </span>
                  </div>
                  {usernameStatus === 'available' && username.length >= 3 && (
                    <p className="text-[11px] text-emerald-400 px-1">@{username} is available ✓</p>
                  )}
                  {usernameStatus === 'taken' && (
                    <p className="text-[11px] text-red-400 px-1">@{username} is taken</p>
                  )}
                  {usernameStatus === 'idle' && username.length === 0 && (
                    <p className="text-[11px] text-white/20 px-1">Letters, numbers, . and _ only</p>
                  )}
                </div>
                <button onClick={handleStep1}
                  disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking' || usernameStatus === 'error' || username.length < 3}
                  className="w-full bg-gold hover:bg-gold/90 active:scale-[0.98] text-[#060606] font-semibold text-sm py-4 rounded-2xl transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2">
                  {loading ? <span className="w-4 h-4 rounded-full border-2 border-[#060606]/30 border-t-[#060606] animate-spin" /> : <>{`Continue`} <ArrowRight size={15} /></>}
                </button>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="space-y-3">
                <div className="relative">
                  <Mail size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'email' ? 'text-gold/60' : 'text-white/25'}`} />
                  <input type="email" placeholder="Email address" value={email}
                    onChange={e => { setEmail(e.target.value); setOtpSent(false); setOtp('') }}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                    autoFocus autoCapitalize="none" autoCorrect="off"
                    disabled={otpSent}
                    className={`${fieldClass('email')} disabled:opacity-50`}
                  />
                </div>

                {!otpSent ? (
                  <button onClick={sendOtp} disabled={loading || !email.trim()}
                    className="w-full bg-gold hover:bg-gold/90 active:scale-[0.98] text-[#060606] font-semibold text-sm py-4 rounded-2xl transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2">
                    {loading ? <span className="w-4 h-4 rounded-full border-2 border-[#060606]/30 border-t-[#060606] animate-spin" /> : 'Send verification code'}
                  </button>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <input type="text" inputMode="numeric" pattern="[0-9]*"
                        placeholder="· · · · · · · ·"
                        maxLength={8}
                        value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        autoFocus
                        className="w-full bg-white/5 border border-white/8 focus:border-gold/60 rounded-2xl py-4 text-center text-2xl tracking-[0.5em] font-mono text-white placeholder-white/15 outline-none transition-all"
                      />
                      <p className="text-[11px] text-white/25 text-center">Code sent to {email}</p>
                    </div>
                    <button onClick={verifyOtp} disabled={loading || otp.length !== 8}
                      className="w-full bg-gold hover:bg-gold/90 active:scale-[0.98] text-[#060606] font-semibold text-sm py-4 rounded-2xl transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2">
                      {loading ? <span className="w-4 h-4 rounded-full border-2 border-[#060606]/30 border-t-[#060606] animate-spin" /> : <>{`Verify`} <ArrowRight size={15} /></>}
                    </button>
                    <p className="text-center">
                      <button onClick={sendOtp} disabled={resendCooldown > 0 || loading}
                        className="text-xs text-white/25 hover:text-white/50 disabled:opacity-40 transition-colors">
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                      </button>
                    </p>
                  </>
                )}

                <button onClick={() => setStep(0)}
                  className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors mx-auto pt-1">
                  <ArrowLeft size={12} /> Back
                </button>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div className="space-y-3">
                <div>
                  <div className="relative">
                    <Lock size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'password' ? 'text-gold/60' : 'text-white/25'}`} />
                    <input type={showPassword ? 'text' : 'password'} placeholder="Choose a password"
                      value={password} onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                      autoFocus autoComplete="new-password"
                      className={`${fieldClass('password')} pr-12`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>
                <button onClick={handleStep3} disabled={loading || password.length < 8}
                  className="w-full bg-gold hover:bg-gold/90 active:scale-[0.98] text-[#060606] font-semibold text-sm py-4 rounded-2xl transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2 mt-1">
                  {loading ? <span className="w-4 h-4 rounded-full border-2 border-[#060606]/30 border-t-[#060606] animate-spin" /> : <>{`Continue`} <ArrowRight size={15} /></>}
                </button>
              </div>
            )}

            {/* ── STEP 4 ── */}
            {step === 4 && (
              <div className="space-y-3">
                <div className="relative">
                  <User size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'name' ? 'text-gold/60' : 'text-white/25'}`} />
                  <input type="text" placeholder="Your full name" value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                    autoFocus autoComplete="name"
                    className={fieldClass('name')}
                  />
                </div>

                <label className="flex items-start gap-3 py-1 cursor-pointer group">
                  <button type="button" onClick={() => setAgreedToTerms(!agreedToTerms)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                      agreedToTerms ? 'bg-gold border-gold' : 'border-white/20 group-hover:border-white/40'
                    }`}>
                    {agreedToTerms && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="#060606" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <p className="text-[11px] text-white/35 leading-relaxed">
                    I'm 18+ and agree to{' '}
                    <Link href="/terms"><span className="text-gold/80 hover:text-gold cursor-pointer">Terms</span></Link>
                    {' '}&amp;{' '}
                    <Link href="/privacy"><span className="text-gold/80 hover:text-gold cursor-pointer">Privacy Policy</span></Link>.
                    I'm responsible for all content I post.
                  </p>
                </label>

                <button onClick={handleStep4} disabled={loading || !name.trim() || !agreedToTerms}
                  className="w-full bg-gold hover:bg-gold/90 active:scale-[0.98] text-[#060606] font-semibold text-sm py-4 rounded-2xl transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2">
                  {loading ? <span className="w-4 h-4 rounded-full border-2 border-[#060606]/30 border-t-[#060606] animate-spin" /> : 'Create my account'}
                </button>

                <p className="text-center text-[11px] text-white/20">You'll design your profile on the next screen</p>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-white/25 mt-5">
            Already have an account?{' '}
            <Link href="/auth/login">
              <span className="text-gold hover:text-gold/80 font-medium cursor-pointer transition-colors">Sign in</span>
            </Link>
          </p>
        </div>
      </div>

      <p className="relative text-center text-[10px] text-white/10 pb-5 tracking-widest uppercase">The Photography Community</p>
    </div>
  )
}
