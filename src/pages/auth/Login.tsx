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

  useEffect(() => {
    const savedRemember = localStorage.getItem(REMEMBER_KEY)
    if (savedRemember === 'false') {
      setRememberMe(false)
    } else {
      const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY)
      if (savedEmail) setEmail(savedEmail)
    }
    setShowPasskeyBtn(hasSavedPasskey())
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
      // Offer to save credentials as passkey (Face ID / Touch ID)
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
    `w-full bg-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-white/20 outline-none border transition-all duration-200 ${
      focused === name ? 'border-gold/60 bg-white/8' : 'border-white/8 hover:border-white/15'
    }`

  return (
    <div className="min-h-screen bg-[#060606] flex flex-col safe-top safe-bottom overflow-hidden relative">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#C9A84C]/8 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#C9A84C]/4 blur-[80px]" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10 flex flex-col items-center gap-3">
          <AppLogo className="h-11" />
          <p className="text-[10px] text-white/25 tracking-[0.45em] uppercase">Photography Platform</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm">
          <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-7 backdrop-blur-sm shadow-2xl">
            <h2 className="text-white font-semibold text-lg mb-1">Welcome back</h2>
            <p className="text-white/35 text-sm mb-6">Sign in to your account</p>

            {/* Passkey / Face ID button */}
            {showPasskeyBtn && (
              <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={passkeyLoading}
                className="w-full mb-4 flex items-center justify-center gap-3 bg-white/5 border border-gold/30 hover:border-gold/60 active:scale-[0.98] rounded-2xl py-4 transition-all duration-150 disabled:opacity-50"
              >
                {passkeyLoading ? (
                  <span className="w-5 h-5 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
                ) : (
                  <Fingerprint size={20} className="text-gold" />
                )}
                <span className="text-sm font-semibold text-white">
                  {passkeyLoading ? 'Authenticating…' : 'Sign in with Face ID / Passkey'}
                </span>
              </button>
            )}

            {showPasskeyBtn && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-[10px] text-white/25 tracking-widest uppercase">or</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3" autoComplete="on">
              {/* Email */}
              <div className="relative">
                <Mail size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'email' ? 'text-gold/60' : 'text-white/25'}`} />
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
                <Lock size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'password' ? 'text-gold/60' : 'text-white/25'}`} />
                <input
                  type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  required autoComplete="current-password"
                  className={`${fieldClass('password')} pr-12`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors p-0.5">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between pt-0.5">
                <button type="button" onClick={() => setRememberMe(r => !r)}
                  className="flex items-center gap-2 group">
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                    rememberMe ? 'bg-gold border-gold' : 'border-white/20 group-hover:border-white/40'
                  }`}>
                    {rememberMe && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="#060606" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors select-none">Remember me</span>
                </button>
                <Link href="/auth/forgot-password">
                  <span className="text-xs text-gold/60 hover:text-gold transition-colors cursor-pointer">Forgot password?</span>
                </Link>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full mt-1 bg-gold hover:bg-gold/90 active:scale-[0.98] text-[#060606] font-semibold text-sm py-4 rounded-2xl transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-[#060606]/30 border-t-[#060606] animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <>Sign In <ArrowRight size={15} /></>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-white/25 mt-5">
            New to LENZLY?{' '}
            <Link href="/auth/signup">
              <span className="text-gold hover:text-gold/80 font-medium cursor-pointer transition-colors">Create an account</span>
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom tagline */}
      <p className="relative text-center text-[10px] text-white/10 pb-5 tracking-widest uppercase">The Photography Community</p>
    </div>
  )
}
