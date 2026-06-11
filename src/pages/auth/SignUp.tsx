import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'wouter'
import { Mail, Lock, Eye, EyeOff, AtSign, CheckCircle, XCircle, AlertCircle, ArrowLeft, User } from 'lucide-react'
import Spinner from '@/components/Spinner'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import AppLogo from '@/components/AppLogo'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'
type Step = 1 | 2 | 3 | 4

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
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500']
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  if (!password) return null
  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score - 1] : 'bg-white/10'}`} />
        ))}
      </div>
      <p className={`text-[11px] pl-1 ${score < 2 ? 'text-red-400' : score < 4 ? 'text-yellow-400' : 'text-emerald-400'}`}>
        {labels[score - 1] ?? 'Too short'} password
      </p>
    </div>
  )
}

export default function SignUp() {
  const [, navigate] = useLocation()
  const [step, setStep] = useState<Step>(1)

  // Step 1 — username
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const latestUsername = useRef('')

  // Step 2 — email + OTP
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Step 3 — password
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Step 4 — name + terms
  const [name, setName] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [loading, setLoading] = useState(false)

  // Username debounce
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

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const inputClass = "w-full bg-lenz-card border border-lenz-border rounded-xl py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"

  // ── Step 1: username ──────────────────────────────────────────────────────
  const handleStep1 = async () => {
    if (username.length < 3) { toast.error('Username must be at least 3 characters'); return }
    if (usernameStatus === 'checking') { toast.error('Please wait — checking username'); return }
    if (usernameStatus === 'taken') { toast.error('That username is already taken'); return }
    if (usernameStatus === 'error') { toast.error('Could not verify username'); return }
    // Final check
    setLoading(true)
    try {
      const available = await checkUsernameAvailable(username)
      if (!available) { setUsernameStatus('taken'); toast.error('Username just taken, try another'); return }
    } catch {
      toast.error('Could not verify username'); return
    } finally { setLoading(false) }
    setStep(2)
  }

  // ── Step 2: send / verify OTP ─────────────────────────────────────────────
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
    if (otp.length !== 6) { toast.error('Enter the 6-digit code'); return }
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

  // ── Step 3: password ──────────────────────────────────────────────────────
  const handleStep3 = async () => {
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setStep(4)
  }

  // ── Step 4: name + profile ────────────────────────────────────────────────
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

  const stepLabel = ['Choose a username', 'Verify your email', 'Set a password', 'Design your profile']

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      {/* Logo */}
      <div className="mb-7 text-center flex flex-col items-center gap-2">
        <AppLogo className="h-14" />
        <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase">Join the Photography Community</p>
      </div>

      <div className="w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {([1, 2, 3, 4] as Step[]).map(s => (
            <div key={s} className={`rounded-full transition-all ${s === step ? 'w-6 h-2 bg-gold' : s < step ? 'w-2 h-2 bg-gold/40' : 'w-2 h-2 bg-white/10'}`} />
          ))}
        </div>

        <p className="text-center text-sm text-white/40 mb-5">{stepLabel[step - 1]}</p>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <div className="relative">
                <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                  autoFocus
                  className={`${inputClass} pl-11 pr-11 ${usernameStatus === 'available' ? 'border-emerald-500/50' : usernameStatus === 'taken' ? 'border-red-500/50' : ''}`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Spinner size="sm" />}
                  {usernameStatus === 'available' && <CheckCircle size={16} className="text-emerald-400" />}
                  {usernameStatus === 'taken' && <XCircle size={16} className="text-red-400" />}
                  {usernameStatus === 'error' && <AlertCircle size={16} className="text-yellow-400" />}
                </span>
              </div>
              {usernameStatus === 'available' && username.length >= 3 && (
                <p className="text-[11px] text-emerald-400 pl-1">@{username} is available</p>
              )}
              {usernameStatus === 'taken' && (
                <p className="text-[11px] text-red-400 pl-1">@{username} is already taken</p>
              )}
              <p className="text-[11px] text-white/25 pl-1">Letters, numbers, periods and underscores only</p>
            </div>
            <button
              onClick={handleStep1}
              disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking' || usernameStatus === 'error' || username.length < 3}
              className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50"
            >
              {loading ? 'Checking…' : 'Continue'}
            </button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-3.5">
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setOtpSent(false); setOtp('') }}
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                disabled={otpSent}
                className={`${inputClass} pl-11 pr-4 disabled:opacity-60`}
              />
            </div>

            {!otpSent ? (
              <button onClick={sendOtp} disabled={loading || !email.trim()} className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50">
                {loading ? 'Sending…' : 'Send verification code'}
              </button>
            ) : (
              <>
                <div className="space-y-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    className={`${inputClass} px-4 text-center text-lg tracking-[0.4em] font-mono`}
                  />
                  <p className="text-[11px] text-white/30 text-center">Code sent to {email}</p>
                </div>
                <button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50">
                  {loading ? 'Verifying…' : 'Verify code'}
                </button>
                <div className="text-center">
                  <button
                    onClick={sendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs text-white/30 hover:text-white/60 disabled:opacity-40 transition-colors"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </>
            )}

            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mx-auto">
              <ArrowLeft size={13} /> Back
            </button>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoFocus
                  autoComplete="new-password"
                  className={`${inputClass} pl-11 pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>
            <button
              onClick={handleStep3}
              disabled={loading || password.length < 8}
              className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Continue'}
            </button>
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step === 4 && (
          <div className="space-y-3.5">
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                autoComplete="name"
                className={`${inputClass} pl-11 pr-4`}
              />
            </div>

            <div className="flex items-start gap-3 py-1">
              <button
                type="button"
                onClick={() => setAgreedToTerms(!agreedToTerms)}
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
              onClick={handleStep4}
              disabled={loading || !name.trim() || !agreedToTerms}
              className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50"
            >
              {loading ? 'Setting up…' : 'Create my account'}
            </button>

            <p className="text-center text-[11px] text-white/20">You can add a photo and bio on the next screen</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-white/30">
            Already have an account?{' '}
            <Link href="/auth/login"><span className="text-gold font-medium cursor-pointer">Sign in</span></Link>
          </p>
        </div>
      </div>
    </div>
  )
}
