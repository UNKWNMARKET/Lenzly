import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Mail, ArrowLeft, CheckCircle, Lock, Eye, EyeOff, KeyRound, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import AppLogo from '@/components/AppLogo'

type Step = 'email' | 'code' | 'password' | 'done'

export default function ForgotPassword() {
  const [, navigate] = useLocation()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!email.trim()) { toast.error('Please enter your email'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setStep('code')
  }

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    })
    setLoading(false)
    if (error) { toast.error('Invalid or expired code — try again'); return }
    setStep('password')
  }

  const setNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setStep('done')
  }

  const fieldClass = (name: string, extra = '') =>
    `w-full bg-white/5 rounded-2xl py-4 text-sm text-white placeholder-white/20 outline-none border transition-all duration-200 ${extra} ${
      focused === name ? 'border-gold/60 bg-white/8' : 'border-white/8 hover:border-white/15'
    }`

  return (
    <div className="min-h-screen bg-[#060606] flex flex-col safe-top safe-bottom overflow-hidden relative">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#C9A84C]/8 blur-[100px]" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          {step !== 'done' && (
            <Link href="/auth/login">
              <button className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors mb-7 -ml-1">
                <ArrowLeft size={16} />
                <span className="text-sm">Back to Sign In</span>
              </button>
            </Link>
          )}

          <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-7 backdrop-blur-sm shadow-2xl">
            {/* ── EMAIL ── */}
            {step === 'email' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <KeyRound size={18} className="text-gold" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-lg leading-tight">Forgot password?</h2>
                    <p className="text-white/35 text-xs mt-0.5">We'll send a reset code to your email</p>
                  </div>
                </div>
                <form onSubmit={sendCode} className="space-y-3">
                  <div className="relative">
                    <Mail size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'email' ? 'text-gold/60' : 'text-white/25'}`} />
                    <input type="email" placeholder="Email address" value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                      required autoComplete="email" autoCapitalize="none" autoCorrect="off" autoFocus
                      className={fieldClass('email', 'pl-12 pr-4')}
                    />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-gold hover:bg-gold/90 active:scale-[0.98] text-[#060606] font-semibold text-sm py-4 rounded-2xl transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2">
                    {loading ? <span className="w-4 h-4 rounded-full border-2 border-[#060606]/30 border-t-[#060606] animate-spin" /> : <>Send code <ArrowRight size={15} /></>}
                  </button>
                </form>
              </>
            )}

            {/* ── CODE ── */}
            {step === 'code' && (
              <>
                <div className="mb-5">
                  <h2 className="text-white font-semibold text-lg">Check your inbox</h2>
                  <p className="text-white/35 text-sm mt-1">Code sent to <span className="text-white/60">{email}</span></p>
                </div>
                <form onSubmit={verifyCode} className="space-y-3">
                  <input inputMode="numeric" autoFocus placeholder="· · · · · · · ·"
                    value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className="w-full bg-white/5 border border-white/8 focus:border-gold/60 rounded-2xl py-4 text-center text-2xl tracking-[0.5em] font-mono text-white placeholder-white/15 outline-none transition-all"
                  />
                  <button type="submit" disabled={loading || code.length < 8}
                    className="w-full bg-gold hover:bg-gold/90 active:scale-[0.98] text-[#060606] font-semibold text-sm py-4 rounded-2xl transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2">
                    {loading ? <span className="w-4 h-4 rounded-full border-2 border-[#060606]/30 border-t-[#060606] animate-spin" /> : <>Verify <ArrowRight size={15} /></>}
                  </button>
                  <p className="text-center text-xs text-white/25">
                    Didn't get it?{' '}
                    <button type="button" onClick={() => sendCode()} className="text-gold/70 hover:text-gold transition-colors">Resend</button>
                  </p>
                </form>
                <button onClick={() => setStep('email')}
                  className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors mt-4 mx-auto">
                  <ArrowLeft size={12} /> Back
                </button>
              </>
            )}

            {/* ── PASSWORD ── */}
            {step === 'password' && (
              <>
                <div className="mb-5">
                  <h2 className="text-white font-semibold text-lg">New password</h2>
                  <p className="text-white/35 text-sm mt-1">Choose something strong</p>
                </div>
                <form onSubmit={setNewPassword} className="space-y-3">
                  <div className="relative">
                    <Lock size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'pw' ? 'text-gold/60' : 'text-white/25'}`} />
                    <input type={show ? 'text' : 'password'} placeholder="New password" value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocused('pw')} onBlur={() => setFocused(null)}
                      required autoFocus
                      className={fieldClass('pw', 'pl-12 pr-12')}
                    />
                    <button type="button" onClick={() => setShow(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="flex gap-1.5 px-1">
                      {[4, 6, 8, 10].map(len => (
                        <div key={len} className={`flex-1 h-1 rounded-full transition-all duration-300 ${password.length >= len ? 'bg-gold' : 'bg-white/10'}`} />
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <Lock size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'confirm' ? 'text-gold/60' : 'text-white/25'}`} />
                    <input type={show ? 'text' : 'password'} placeholder="Confirm password" value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)}
                      required
                      className={fieldClass('confirm', 'pl-12 pr-4')}
                    />
                  </div>
                  {confirm.length > 0 && password !== confirm && (
                    <p className="text-[11px] text-red-400 px-1">Passwords don't match</p>
                  )}
                  <button type="submit" disabled={loading}
                    className="w-full bg-gold hover:bg-gold/90 active:scale-[0.98] text-[#060606] font-semibold text-sm py-4 rounded-2xl transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2 mt-1">
                    {loading ? <span className="w-4 h-4 rounded-full border-2 border-[#060606]/30 border-t-[#060606] animate-spin" /> : 'Reset password'}
                  </button>
                </form>
              </>
            )}

            {/* ── DONE ── */}
            {step === 'done' && (
              <div className="flex flex-col items-center gap-4 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle size={26} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Password updated</h2>
                  <p className="text-white/35 text-sm mt-1.5 leading-relaxed">You can now sign in with your new password.</p>
                </div>
                <button onClick={() => navigate('/auth/login')}
                  className="w-full bg-gold hover:bg-gold/90 text-[#060606] font-semibold text-sm py-4 rounded-2xl transition-all duration-150 flex items-center justify-center gap-2 mt-1">
                  Sign In <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>

          {step !== 'done' && (
            <p className="text-center text-sm text-white/25 mt-5">
              Remember it?{' '}
              <Link href="/auth/login">
                <span className="text-gold hover:text-gold/80 font-medium cursor-pointer transition-colors">Sign in</span>
              </Link>
            </p>
          )}
        </div>
      </div>

      <p className="relative text-center text-[10px] text-white/10 pb-5 tracking-widest uppercase">The Photography Community</p>
    </div>
  )
}
