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

export default function Login() {
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const [mode, setMode] = useState<'social' | 'email'>('social')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [socialLoading, setSocialLoading] = useState<'apple' | 'google' | null>(null)
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

  const handleSocialLogin = async (provider: 'apple' | 'google') => {
    setSocialLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: 'https://lenzly.com/auth/callback' },
    })
    if (error) { toast.error(error.message); setSocialLoading(null) }
  }

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
    `w-full bg-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-white/20 outline-none border transition-all duration-200 ${
      focused === name ? 'border-gold/60 bg-white/8 shadow-[0_0_0_3px_rgba(201,168,76,0.08)]' : 'border-white/8 hover:border-white/15'
    }`

  return (
    <div className="min-h-screen bg-[#060606] flex flex-col safe-top safe-bottom overflow-hidden relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb-top absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#C9A84C]/8 blur-[100px]" />
        <div className="orb-bot absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#C9A84C]/4 blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(201,168,76,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.4) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="login-logo text-center mb-10 flex flex-col items-center gap-3">
          <AppLogo className="h-11" />
          <p className="login-sub text-[10px] text-white/25 tracking-[0.45em] uppercase">Photography Platform</p>
        </div>

        <div className="login-card w-full max-w-sm">
          <div className="card-shimmer bg-white/[0.03] border border-white/8 rounded-3xl p-7 backdrop-blur-sm shadow-2xl shadow-black/60">

            {mode === 'social' ? (
              <>
                <h2 className="text-white font-semibold text-lg mb-1">Welcome back</h2>
                <p className="text-white/35 text-sm mb-6">Sign in to your account</p>

                {showPasskeyBtn && (
                  <button type="button" onClick={handlePasskeyLogin} disabled={passkeyLoading}
                    className="w-full mb-3 flex items-center justify-center gap-3 bg-white/5 border border-gold/30 hover:border-gold/60 active:scale-[0.98] rounded-2xl py-4 transition-all duration-200 disabled:opacity-50 hover:bg-white/8">
                    {passkeyLoading ? <span className="w-5 h-5 rounded-full border-2 border-gold/30 border-t-gold animate-spin" /> : <Fingerprint size={20} className="text-gold" />}
                    <span className="text-sm font-semibold text-white">{passkeyLoading ? 'Authenticating…' : 'Sign in with Face ID'}</span>
                  </button>
                )}

                <button onClick={() => handleSocialLogin('apple')} disabled={!!socialLoading}
                  className="w-full mb-3 flex items-center justify-center gap-3 bg-white text-[#060606] active:scale-[0.98] rounded-2xl py-4 font-semibold text-sm transition-all duration-150 disabled:opacity-60 hover:bg-white/90">
                  {socialLoading === 'apple' ? <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" /> : <AppleIcon />}
                  Continue with Apple
                </button>

                <button onClick={() => handleSocialLogin('google')} disabled={!!socialLoading}
                  className="w-full mb-4 flex items-center justify-center gap-3 bg-white/[0.06] border border-white/10 text-white active:scale-[0.98] rounded-2xl py-4 font-semibold text-sm transition-all duration-150 disabled:opacity-60 hover:bg-white/10">
                  {socialLoading === 'google' ? <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> : <GoogleIcon />}
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-[10px] text-white/25 tracking-widest uppercase">or</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                <button onClick={() => setMode('email')}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/8 hover:border-white/20 text-white/70 hover:text-white rounded-2xl py-4 text-sm font-medium transition-all duration-150 active:scale-[0.98]">
                  <Mail size={16} />
                  Sign in with Email
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setMode('social')} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-5">
                  ← Back
                </button>
                <h2 className="text-white font-semibold text-lg mb-1">Sign in with email</h2>
                <p className="text-white/35 text-sm mb-5">Enter your email and password</p>

                <form onSubmit={handleLogin} className="space-y-3" autoComplete="on">
                  <div className="relative">
                    <Mail size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused === 'email' ? 'text-gold/70' : 'text-white/25'}`} />
                    <input type="email" name="email" placeholder="Email address" value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                      required autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                      className={fieldClass('email')} />
                  </div>

                  <div className="relative">
                    <Lock size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused === 'password' ? 'text-gold/70' : 'text-white/25'}`} />
                    <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                      required autoComplete="current-password"
                      className={`${fieldClass('password')} pr-12`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors p-0.5">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <button type="button" onClick={() => setRememberMe(r => !r)} className="flex items-center gap-2 group">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-200 ${rememberMe ? 'bg-gold border-gold' : 'border-white/20 group-hover:border-white/40'}`}>
                        {rememberMe && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="#060606" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors select-none">Remember me</span>
                    </button>
                    <Link href="/auth/forgot-password">
                      <span className="text-xs text-gold/60 hover:text-gold transition-colors cursor-pointer">Forgot password?</span>
                    </Link>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full mt-1 bg-gold hover:bg-gold/90 active:scale-[0.98] text-[#060606] font-semibold text-sm py-4 rounded-2xl transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(201,168,76,0.3)]">
                    {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-[#060606]/30 border-t-[#060606] animate-spin" />Signing in…</span> : <>Sign In <ArrowRight size={15} /></>}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="login-footer text-center text-sm text-white/25 mt-5">
            New to LENZLY?{' '}
            <Link href="/auth/signup">
              <span className="text-gold hover:text-gold/80 font-medium cursor-pointer transition-colors">Create an account</span>
            </Link>
          </p>
        </div>
      </div>

      <p className="login-tagline relative text-center text-[10px] text-white/10 pb-5 tracking-widest uppercase">The Photography Community</p>
    </div>
  )
}
