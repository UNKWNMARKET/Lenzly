import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Mail, ArrowLeft, CheckCircle, ShieldCheck, Lock, Eye, EyeOff, KeyRound } from 'lucide-react'
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
    if (error) { toast.error('Invalid or expired code. Please try again.'); return }
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

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        {step !== 'done' && (
          <Link href="/auth/login">
            <button className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-8 -ml-1">
              <ArrowLeft size={18} />
              <span className="text-sm">Back to Sign In</span>
            </button>
          </Link>
        )}

        {/* Step: email */}
        {step === 'email' && (
          <>
            <div className="mb-8 flex flex-col items-center gap-2 text-center">
              <AppLogo className="h-12" />
              <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mt-3">
                <KeyRound size={24} className="text-gold" />
              </div>
              <h2 className="text-white font-bold text-lg mt-2 tracking-wide">Reset your password</h2>
              <p className="text-white/35 text-sm leading-relaxed">Enter your email and we'll send you a verification code.</p>
            </div>
            <form onSubmit={sendCode} className="space-y-4">
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
                  required autoComplete="email" autoCapitalize="none" autoCorrect="off"
                  className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50">
                {loading ? 'Sending…' : 'Send Code'}
              </button>
            </form>
          </>
        )}

        {/* Step: code */}
        {step === 'code' && (
          <>
            <div className="mb-8 flex flex-col items-center gap-2 text-center">
              <AppLogo className="h-12" />
              <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mt-3">
                <ShieldCheck size={24} className="text-gold" />
              </div>
              <h2 className="text-white font-bold text-lg mt-2 tracking-wide">Enter your code</h2>
              <p className="text-white/35 text-sm leading-relaxed">We sent a verification code to<br /><span className="text-white/70 font-medium">{email}</span></p>
            </div>
            <form onSubmit={verifyCode} className="space-y-4">
              <input inputMode="numeric" autoFocus placeholder="00000000" value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-4 text-center text-2xl tracking-[0.4em] font-mono text-white placeholder-white/15 outline-none focus:border-gold/50 transition-colors" />
              <button type="submit" disabled={loading || code.length < 6} className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50">
                {loading ? 'Verifying…' : 'Verify Code'}
              </button>
              <p className="text-center text-xs text-white/30">
                Didn't get it?{' '}
                <button type="button" onClick={() => sendCode()} className="text-gold hover:text-gold/80">Resend code</button>
              </p>
            </form>
          </>
        )}

        {/* Step: password */}
        {step === 'password' && (
          <>
            <div className="mb-8 flex flex-col items-center gap-2 text-center">
              <AppLogo className="h-12" />
              <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mt-3">
                <Lock size={24} className="text-gold" />
              </div>
              <h2 className="text-white font-bold text-lg mt-2 tracking-wide">Set a new password</h2>
              <p className="text-white/35 text-sm leading-relaxed">Choose a strong password for your account.</p>
            </div>
            <form onSubmit={setNewPassword} className="space-y-4">
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input type={show ? 'text' : 'password'} placeholder="New password" value={password}
                  onChange={e => setPassword(e.target.value)} required
                  className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors" />
                <button type="button" onClick={() => setShow(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input type={show ? 'text' : 'password'} placeholder="Confirm new password" value={confirm}
                  onChange={e => setConfirm(e.target.value)} required
                  className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors" />
              </div>
              {password.length > 0 && (
                <div className="flex gap-1">
                  {[4, 6, 8, 10].map(len => (
                    <div key={len} className={`flex-1 h-1 rounded-full transition-colors ${password.length >= len ? 'bg-gold' : 'bg-white/10'}`} />
                  ))}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50">
                {loading ? 'Updating…' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-5 text-center">
            <AppLogo className="h-12" />
            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mt-2">
              <CheckCircle size={28} className="text-gold" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg tracking-wide">Password reset</h2>
              <p className="text-white/40 text-sm mt-2 leading-relaxed">Your password has been updated.<br />You can now sign in.</p>
            </div>
            <button onClick={() => navigate('/auth/login')}
              className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider mt-2">
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
