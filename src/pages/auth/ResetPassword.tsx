import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import AppLogo from '@/components/AppLogo'

export default function ResetPassword() {
  const [, navigate] = useLocation()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash — listen for the session event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Password updated! Please sign in.')
    await supabase.auth.signOut()
    navigate('/auth/login')
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <AppLogo className="h-12" />
          <p className="text-white/40 text-sm mt-4 leading-relaxed">
            Waiting for your reset link to be verified…
          </p>
          <p className="text-white/25 text-xs leading-relaxed">
            If you arrived here without clicking a reset link, please{' '}
            <span
              className="text-gold cursor-pointer"
              onClick={() => navigate('/auth/forgot-password')}
            >
              request one here
            </span>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <AppLogo className="h-12" />
          <h2 className="text-white font-bold text-lg mt-4 tracking-wide">Set new password</h2>
          <p className="text-white/35 text-sm">Choose a strong password for your account.</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New password (min 6 characters)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className={`w-full bg-lenz-card border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none transition-colors ${
                confirm && confirm !== password ? 'border-red-500/50' : 'border-lenz-border focus:border-gold/50'
              }`}
            />
          </div>
          {confirm && confirm !== password && (
            <p className="text-[11px] text-red-400 pl-1">Passwords don't match</p>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirm || password !== confirm}
            className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50"
          >
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
