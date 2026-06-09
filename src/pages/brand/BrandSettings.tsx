import { useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react'
import { useBrandAuth } from '@/contexts/BrandAuthContext'
import { toast } from 'sonner'

export default function BrandSettings() {
  const { brand, api, logout } = useBrandAuth()
  const [, navigate] = useLocation()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (next.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (next !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    const res = await api('/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    })
    setLoading(false)
    if (res.ok) {
      toast.success('Password updated. Please sign in again.')
      logout()
      navigate('/brand-portal/login')
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Failed to update password')
    }
  }

  return (
    <div className="min-h-screen bg-[#060606]">
      <header className="sticky top-0 z-40 bg-[#060606]/95 backdrop-blur border-b border-[#1A1A1A] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/brand-portal')} className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-white">Account Settings</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Account info */}
        <div className="bg-[#0E0E0E] border border-[#1A1A1A] rounded-2xl p-5">
          <p className="text-[10px] text-white/30 tracking-widest uppercase mb-4">Account</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-white/40 mb-0.5">Company</p>
              <p className="text-sm text-white">{brand?.company}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-0.5">Email</p>
              <p className="text-sm text-white">{brand?.email}</p>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-[#0E0E0E] border border-[#1A1A1A] rounded-2xl p-5">
          <p className="text-[10px] text-white/30 tracking-widest uppercase mb-4">Change Password</p>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { label: 'Current Password', value: current, set: setCurrent },
              { label: 'New Password', value: next, set: setNext },
              { label: 'Confirm New Password', value: confirm, set: setConfirm },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">{label}</label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={value}
                    onChange={e => set(e.target.value)}
                    required
                    className="w-full bg-[#141414] border border-[#222] rounded-xl pl-9 pr-10 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40"
                  />
                  {label === 'Current Password' && (
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25">
                      {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-[#C9A84C] text-[#060606] font-bold text-sm disabled:opacity-50">
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Sign out */}
        <button onClick={() => { logout(); navigate('/brand-portal/login') }}
          className="w-full py-3.5 rounded-2xl bg-red-950/20 border border-red-500/15 text-red-400 text-sm font-semibold">
          Sign Out
        </button>
      </div>
    </div>
  )
}
