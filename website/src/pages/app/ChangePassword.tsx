import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, Eye, EyeOff, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function ChangePassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setSaving(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => navigate(-1), 1500)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 z-30 glass border-b border-white/5 px-4 h-14 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold text-white">Change Password</h1>
      </header>

      <div className="px-4 py-8">
        <div className="card p-6 max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <KeyRound size={18} className="text-gold" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Update your password</h2>
              <p className="text-xs text-white/35">Choose a new password for your account</p>
            </div>
          </div>

          {done ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mb-3">
                <Check size={22} className="text-gold" />
              </div>
              <p className="text-white font-medium">Password updated</p>
              <p className="text-sm text-white/35 mt-1">Redirecting…</p>
            </div>
          ) : (
            <form onSubmit={save} className="space-y-4">
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 pr-11 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50"
                />
                <button type="button" onClick={() => setShow(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <input
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50"
              />

              {password.length > 0 && (
                <div className="flex gap-1">
                  {[4, 6, 8, 10].map(len => (
                    <div key={len} className={`flex-1 h-1 rounded-full transition-colors ${password.length >= len ? 'bg-gold' : 'bg-white/10'}`} />
                  ))}
                </div>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button type="submit" disabled={saving || !password || !confirm}
                className="w-full py-3.5 rounded-xl bg-gold text-lenz-bg font-semibold text-sm hover:opacity-90 disabled:opacity-50">
                {saving ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
