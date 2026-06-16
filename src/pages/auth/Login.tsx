import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Fingerprint } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import AppLogo from '@/components/AppLogo'
import { savePasskeyCredential, getPasskeyCredential, hasSavedPasskey } from '@/lib/passkey'

const SAVED_EMAIL_KEY = 'lenzly_saved_email'
const REMEMBER_KEY    = 'lenzly_remember_me'

export default function Login() {
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [rememberMe, setRememberMe]     = useState(true)
  const [focused, setFocused]           = useState<string | null>(null)
  const [showPasskeyBtn, setShowPasskeyBtn] = useState(false)
  const [mounted, setMounted]           = useState(false)

  useEffect(() => {
    const savedRemember = localStorage.getItem(REMEMBER_KEY)
    if (savedRemember === 'false') {
      setRememberMe(false)
    } else {
      const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY)
      if (savedEmail) setEmail(savedEmail)
    }
    setShowPasskeyBtn(hasSavedPasskey())
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

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
    } else {
      const saved = await savePasskeyCredential(email, password)
      if (saved) setShowPasskeyBtn(true)
    }
  }

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true)
    try {
      const cred = await getPasskeyCredential()
      if (!cred) {
        toast.error('No saved passkey found')
        setShowPasskeyBtn(false)
        setPasskeyLoading(false)
        return
      }
      const { error } = await supabase.auth.signInWithPassword({ email: cred.email, password: cred.password })
      if (error) {
        toast.error('Passkey sign-in failed — please log in manually')
        setPasskeyLoading(false)
      }
    } catch {
      toast.error('Passkey sign-in cancelled')
      setPasskeyLoading(false)
    }
  }

  const fieldClass = (name: string) =>
    `w-full bg-white/[0.04] rounded-2xl pl-11 pr-4 py-[15px] text-sm text-white placeholder-white/20 outline-none border transition-all duration-300 ${
      focused === name
        ? 'border-[#C9A84C]/50 bg-white/[0.07] shadow-[0_0_0_3px_rgba(201,168,76,0.07),inset_0_1px_0_rgba(201,168,76,0.08)]'
        : 'border-white/[0.07] hover:border-white/[0.13] hover:bg-white/[0.05]'
    }`

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col safe-top safe-bottom overflow-hidden relative">

      {/* ── Atmospheric background ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Primary gold bloom — top center */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full bg-[#C9A84C]/[0.07] blur-[120px]" />
        {/* Secondary accent — bottom left */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#C9A84C]/[0.05] blur-[90px]" />
        {/* Tertiary — right edge */}
        <div className="absolute top-1/3 -right-16 w-48 h-48 rounded-full bg-[#C9A84C]/[0.04] blur-[70px]" />

        {/* Fine grid */}
        <div className="absolute inset-0 opacity-[0.022]" style={{
          backgroundImage: 'linear-gradient(rgba(201,168,76,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />

        {/* Decorative aperture ring */}
        <svg className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[420px] h-[420px] opacity-[0.045]" viewBox="0 0 420 420" fill="none">
          <circle cx="210" cy="210" r="200" stroke="#C9A84C" strokeWidth="0.75"/>
          <circle cx="210" cy="210" r="170" stroke="#C9A84C" strokeWidth="0.5"/>
          <circle cx="210" cy="210" r="140" stroke="#C9A84C" strokeWidth="0.75"/>
          {[0,45,90,135,180,225,270,315].map(deg => {
            const r = (deg * Math.PI) / 180
            const x1 = 210 + 142 * Math.cos(r)
            const y1 = 210 + 142 * Math.sin(r)
            const x2 = 210 + 198 * Math.cos(r)
            const y2 = 210 + 198 * Math.sin(r)
            return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C9A84C" strokeWidth="0.5"/>
          })}
        </svg>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-10">

        {/* ── Logo block ── */}
        <div
          className="text-center mb-10 flex flex-col items-center gap-3"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(-14px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <AppLogo className="h-10" />
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#C9A84C]/30" />
            <p className="text-[9px] text-white/25 tracking-[0.5em] uppercase font-light">Photography Platform</p>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#C9A84C]/30" />
          </div>
        </div>

        {/* ── Card ── */}
        <div
          className="w-full max-w-sm"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.65s ease 0.1s, transform 0.65s ease 0.1s',
          }}
        >
          {/* Glass card */}
          <div className="relative bg-white/[0.025] border border-white/[0.07] rounded-3xl p-7 backdrop-blur-md shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)]">

            {/* Subtle top highlight */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />

            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-white font-semibold text-[19px] tracking-tight mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Welcome back
              </h2>
              <p className="text-white/35 text-[13px]">Sign in to continue to Lenzly</p>
            </div>

            {/* Passkey / Face ID */}
            {showPasskeyBtn && (
              <>
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={passkeyLoading}
                  className="w-full mb-4 flex items-center justify-center gap-2.5 bg-white/[0.04] border border-[#C9A84C]/25 hover:border-[#C9A84C]/50 active:scale-[0.98] rounded-2xl py-[14px] transition-all duration-200 disabled:opacity-50 hover:bg-white/[0.07] hover:shadow-[0_0_24px_rgba(201,168,76,0.08)]"
                >
                  {passkeyLoading
                    ? <span className="w-[18px] h-[18px] rounded-full border-2 border-[#C9A84C]/30 border-t-[#C9A84C] animate-spin" />
                    : <Fingerprint size={18} className="text-[#C9A84C]" />
                  }
                  <span className="text-[13px] font-semibold text-white/80">
                    {passkeyLoading ? 'Authenticating…' : 'Sign in with Face ID / Passkey'}
                  </span>
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-white/[0.07]" />
                  <span className="text-[10px] text-white/20 tracking-[0.3em] uppercase">or</span>
                  <div className="flex-1 h-px bg-white/[0.07]" />
                </div>
              </>
            )}

            <form onSubmit={handleLogin} className="space-y-3" autoComplete="on">

              {/* Email */}
              <div className="relative">
                <Mail size={14} className={`absolute left-[14px] top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused === 'email' ? 'text-[#C9A84C]/70' : 'text-white/20'}`} />
                <input
                  type="email" name="email" placeholder="Email address" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  required autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                  className={fieldClass('email')}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock size={14} className={`absolute left-[14px] top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused === 'password' ? 'text-[#C9A84C]/70' : 'text-white/20'}`} />
                <input
                  type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  required autoComplete="current-password"
                  className={`${fieldClass('password')} pr-11`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[14px] top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors p-1">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between pt-0.5">
                <button type="button" onClick={() => setRememberMe(r => !r)} className="flex items-center gap-2 group">
                  <div className={`w-[15px] h-[15px] rounded-[4px] border flex items-center justify-center transition-all duration-200 ${
                    rememberMe ? 'bg-[#C9A84C] border-[#C9A84C] shadow-[0_0_10px_rgba(201,168,76,0.35)]' : 'border-white/15 group-hover:border-white/30'
                  }`}>
                    {rememberMe && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="#060608" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-[11px] text-white/35 group-hover:text-white/55 transition-colors select-none">Remember me</span>
                </button>
                <Link href="/auth/forgot-password">
                  <span className="text-[11px] text-[#C9A84C]/55 hover:text-[#C9A84C] transition-colors cursor-pointer">Forgot password?</span>
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 relative overflow-hidden rounded-2xl py-[15px] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-[13px] font-bold text-[#060608] shadow-[0_6px_28px_rgba(201,168,76,0.28)] hover:shadow-[0_8px_36px_rgba(201,168,76,0.42)]"
                style={{ background: 'linear-gradient(135deg, #D4AF5A 0%, #C9A84C 50%, #B8952E 100%)' }}
              >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-[#060608]/25 border-t-[#060608] animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>Sign In <ArrowRight size={14} /></>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p
            className="text-center text-[12px] text-white/22 mt-5"
            style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.7s ease 0.3s',
            }}
          >
            New to LENZLY?{' '}
            <Link href="/auth/signup">
              <span className="text-[#C9A84C]/70 hover:text-[#C9A84C] font-medium cursor-pointer transition-colors">Create an account</span>
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom tagline */}
      <p
        className="relative text-center text-[9px] text-white/[0.08] pb-5 tracking-[0.5em] uppercase"
        style={{
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.8s ease 0.4s',
        }}
      >
        The Photography Community
      </p>
    </div>
  )
}
