import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, KeyRound, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'

type Step = 'email' | 'code' | 'password' | 'done'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault()
    setError(''); setLoading(true)
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setStep('code')
  }

  async function resend() {
    setResent(false)
    await sendCode()
    setResent(true)
    setTimeout(() => setResent(false), 3000)
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    })
    setLoading(false)
    if (err) { setError('Invalid or expired code. Please try again.'); return }
    setStep('password')
  }

  async function setNewPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setStep('done')
  }

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gold/5 blur-[120px] pointer-events-none" />
      <Link to="/login" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to sign in
      </Link>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-2xl font-black tracking-[0.3em] gold-text">LENZLY</span>
        </div>

        {/* Step: enter email */}
        {step === 'email' && (
          <form onSubmit={sendCode} className="card p-7 space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
                <KeyRound size={20} className="text-gold" />
              </div>
              <h1 className="text-xl font-serif text-white mb-1">Forgot password?</h1>
              <p className="text-sm text-white/35">Enter your email and we'll send you a verification code</p>
            </div>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading || !email}
              className="w-full py-3.5 rounded-xl bg-gold text-lenz-bg font-semibold text-sm hover:opacity-90 disabled:opacity-50">
              {loading ? 'Sending code…' : 'Send Code'}
            </button>
          </form>
        )}

        {/* Step: enter code */}
        {step === 'code' && (
          <form onSubmit={verifyCode} className="card p-7 space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck size={20} className="text-gold" />
              </div>
              <h1 className="text-xl font-serif text-white mb-1">Enter your code</h1>
              <p className="text-sm text-white/35">We sent a verification code to<br/><span className="text-white/60">{email}</span></p>
            </div>
            <input
              inputMode="numeric"
              autoFocus
              placeholder="00000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.4em] font-mono text-white placeholder-white/15 outline-none focus:border-gold/50"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading || code.length < 6}
              className="w-full py-3.5 rounded-xl bg-gold text-lenz-bg font-semibold text-sm hover:opacity-90 disabled:opacity-50">
              {loading ? 'Verifying…' : 'Verify Code'}
            </button>
            <p className="text-center text-xs text-white/30">
              Didn't get it?{' '}
              <button type="button" onClick={resend} className="text-gold hover:text-gold/80">
                {resent ? 'Code resent ✓' : 'Resend code'}
              </button>
            </p>
          </form>
        )}

        {/* Step: new password */}
        {step === 'password' && (
          <form onSubmit={setNewPassword} className="card p-7 space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
                <Lock size={20} className="text-gold" />
              </div>
              <h1 className="text-xl font-serif text-white mb-1">Set a new password</h1>
              <p className="text-sm text-white/35">Choose a strong password for your account</p>
            </div>
            <div className="relative">
              <input type={show ? 'text' : 'password'} placeholder="New password" value={password}
                onChange={e => setPassword(e.target.value)} required
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 pr-11 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50" />
              <button type="button" onClick={() => setShow(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <input type={show ? 'text' : 'password'} placeholder="Confirm new password" value={confirm}
              onChange={e => setConfirm(e.target.value)} required
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50" />
            {password.length > 0 && (
              <div className="flex gap-1">
                {[4, 6, 8, 10].map(len => (
                  <div key={len} className={`flex-1 h-1 rounded-full transition-colors ${password.length >= len ? 'bg-gold' : 'bg-white/10'}`} />
                ))}
              </div>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading || !password || !confirm}
              className="w-full py-3.5 rounded-xl bg-gold text-lenz-bg font-semibold text-sm hover:opacity-90 disabled:opacity-50">
              {loading ? 'Updating…' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <div className="card p-7 text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto">
              <Check size={22} className="text-gold" />
            </div>
            <div>
              <h1 className="text-xl font-serif text-white mb-1">Password reset</h1>
              <p className="text-sm text-white/35">Your password has been updated. You can now sign in.</p>
            </div>
            <button onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-xl bg-gold text-lenz-bg font-semibold text-sm hover:opacity-90">
              Go to Sign In
            </button>
            <Link to="/business/login" className="block text-xs text-white/30 hover:text-gold">Business sign in →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
