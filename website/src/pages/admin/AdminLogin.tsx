import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, ShieldCheck, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const ADMIN_EMAIL = 'eisdorferjesse@gmail.com'
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 min
const ATTEMPT_KEY = 'admin_attempts'
const LOCKOUT_KEY = 'admin_lockout_until'

function getAttempts(): number { return parseInt(localStorage.getItem(ATTEMPT_KEY) || '0', 10) }
function getLockoutUntil(): number { return parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10) }

function recordFailure() {
  const n = getAttempts() + 1
  localStorage.setItem(ATTEMPT_KEY, String(n))
  if (n >= MAX_ATTEMPTS) localStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_MS))
}
function clearAttempts() {
  localStorage.removeItem(ATTEMPT_KEY)
  localStorage.removeItem(LOCKOUT_KEY)
}

export default function AdminLogin() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (user?.email?.toLowerCase() === ADMIN_EMAIL) navigate('/admin', { replace: true })
  }, [user, navigate])

  // Tick lockout countdown
  useEffect(() => {
    function check() {
      const until = getLockoutUntil()
      const left = until - Date.now()
      if (left > 0) { setLocked(true); setRemaining(Math.ceil(left / 1000)) }
      else { setLocked(false); setRemaining(0) }
    }
    check()
    timerRef.current = setInterval(check, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (locked) return

    const until = getLockoutUntil()
    if (until > Date.now()) return

    setError(''); setLoading(true)
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    })
    setLoading(false)

    if (authError || data.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
      if (data.user) await supabase.auth.signOut()
      recordFailure()
      const attempts = getAttempts()
      const left = MAX_ATTEMPTS - attempts
      if (attempts >= MAX_ATTEMPTS) {
        setError(`Too many failed attempts. Locked for 15 minutes.`)
        setLocked(true)
      } else {
        setError(`Incorrect password. ${left} attempt${left === 1 ? '' : 's'} remaining.`)
      }
      return
    }

    clearAttempts()
  }

  const attemptsUsed = getAttempts()
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[250px] bg-gold/4 blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-xs">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gold/5">
            <ShieldCheck size={24} className="text-gold" />
          </div>
          <h1 className="text-xl font-serif text-white mb-1 tracking-wide">Admin Portal</h1>
          <p className="text-xs text-white/30 tracking-wide">LENZLY · RESTRICTED ACCESS</p>
        </div>

        {/* Lockout banner */}
        {locked && (
          <div className="mb-5 bg-red-950/40 border border-red-500/25 rounded-xl px-4 py-3.5 flex items-start gap-3">
            <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-medium">Account locked</p>
              <p className="text-xs text-red-400/70 mt-0.5">Too many failed attempts. Try again in <span className="font-mono font-semibold">{fmt(remaining)}</span></p>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          {/* Password only — email is hardcoded, never shown */}
          <div className="relative">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={locked}
              className="w-full bg-white/4 border border-white/8 rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-white/20 outline-none focus:border-gold/40 transition-colors disabled:opacity-40"
            />
            <button type="button" onClick={() => setShowPass(v => !v)} disabled={locked}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors disabled:opacity-40">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && !locked && (
            <div className="bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}

          {attemptsUsed > 0 && attemptsUsed < MAX_ATTEMPTS && !locked && (
            <div className="flex gap-1 pt-1">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i < attemptsUsed ? 'bg-red-500' : 'bg-white/8'}`} />
              ))}
            </div>
          )}

          <button type="submit" disabled={loading || locked}
            className="w-full py-3.5 rounded-xl bg-gold text-lenz-bg font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-all shadow-lg shadow-gold/15 mt-1">
            {loading ? 'Verifying…' : 'Access Portal'}
          </button>
        </form>

        <p className="text-center text-[11px] text-white/15 mt-8 tracking-wider uppercase">
          Unauthorized access is prohibited
        </p>
      </div>
    </div>
  )
}
