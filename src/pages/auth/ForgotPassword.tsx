import { useState } from 'react'
import { Link } from 'wouter'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import AppLogo from '@/components/AppLogo'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { toast.error('Please enter your email'); return }
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: 'https://lenzly.app/auth/reset-password',
    })

    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
        <div className="flex flex-col items-center gap-5 text-center max-w-xs">
          <AppLogo className="h-12" />
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mt-2">
            <CheckCircle size={28} className="text-gold" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg tracking-wide">Check your email</h2>
            <p className="text-white/40 text-sm mt-2 leading-relaxed">
              We sent a password reset link to<br />
              <span className="text-white/70 font-medium">{email}</span>
            </p>
            <p className="text-white/25 text-xs mt-3 leading-relaxed">
              Click the link in the email to set a new password. Check your spam folder if you don't see it.
            </p>
          </div>
          <Link href="/auth/login">
            <span className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider mt-2 inline-block text-center cursor-pointer">
              Back to Sign In
            </span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        <Link href="/auth/login">
          <button className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-8 -ml-1">
            <ArrowLeft size={18} />
            <span className="text-sm">Back to Sign In</span>
          </button>
        </Link>

        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <AppLogo className="h-12" />
          <h2 className="text-white font-bold text-lg mt-4 tracking-wide">Reset your password</h2>
          <p className="text-white/35 text-sm leading-relaxed">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  )
}
