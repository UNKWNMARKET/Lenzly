import { useState } from 'react'
import { useLocation } from 'wouter'
import { ChevronLeft, Camera, Check, ShieldCheck, Lock } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { usePro } from '@/contexts/ProContext'
import { toast } from 'sonner'

const INCLUDED = [
  'Verified gold camera badge',
  'Appear first in brand searches',
  'Priority discovery by brands & clients',
  'Unlimited photo spots',
  'Featured pin on the photographer map',
]

export default function ProCheckout() {
  const [, navigate] = useLocation()
  const { isProMember, buyPro, restore } = usePro()
  const [busy, setBusy] = useState(false)

  // Already Pro — no need to be on the checkout page
  if (isProMember) {
    navigate('/pro')
    return null
  }

  const handleConfirm = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast.info('Open the LENZLY iOS app to complete your subscription.')
      return
    }
    setBusy(true)
    try {
      const ok = await buyPro()
      if (ok) {
        toast.success('Welcome to LENZLY Pro! 🎉')
        navigate('/pro')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Purchase could not be completed.')
    }
    setBusy(false)
  }

  const handleRestore = async () => {
    setBusy(true)
    const ok = await restore()
    if (ok) {
      toast.success('Pro restored!')
      navigate('/pro')
    } else {
      toast.info('No previous purchases found.')
    }
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-lenz-bg pb-24 safe-top">
      <header className="sticky top-0 z-40 glass-dark px-4 py-3 flex items-center gap-3 safe-top">
        <button onClick={() => navigate('/pro')} className="p-1 -ml-1">
          <ChevronLeft size={22} className="text-white/70" />
        </button>
        <h2 className="text-sm font-bold tracking-widest uppercase text-white">Checkout</h2>
      </header>

      <div className="px-5 pt-6">
        {/* Plan summary card */}
        <div className="bg-lenz-card border border-lenz-border rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gold flex items-center justify-center shrink-0">
              <Camera size={24} className="text-lenz-bg" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-base font-bold text-white">LENZLY Pro</p>
              <p className="text-xs text-white/40">Monthly subscription</p>
            </div>
          </div>

          <div className="flex items-end justify-between border-t border-lenz-border pt-4">
            <span className="text-sm text-white/50">Total today</span>
            <span className="text-2xl font-bold text-white">
              $4.99<span className="text-sm font-medium text-white/40">/month</span>
            </span>
          </div>
        </div>

        {/* What's included */}
        <p className="text-[11px] font-bold tracking-[0.2em] text-white/30 uppercase mb-3 px-1">
          What's included
        </p>
        <div className="bg-lenz-card border border-lenz-border rounded-2xl p-4 mb-5 space-y-3">
          {INCLUDED.map(item => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                <Check size={12} className="text-gold" strokeWidth={3} />
              </div>
              <span className="text-sm text-white/80">{item}</span>
            </div>
          ))}
        </div>

        {/* Trust row */}
        <div className="flex items-center justify-center gap-2 mb-5 text-white/30">
          <Lock size={12} />
          <span className="text-[11px]">Secure payment through your Apple ID</span>
        </div>

        {/* Confirm */}
        <button
          onClick={handleConfirm}
          disabled={busy}
          className="btn-primary w-full py-4 text-sm font-bold tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {busy ? 'Processing…' : (
            <>
              <ShieldCheck size={18} />
              Confirm &amp; Subscribe
            </>
          )}
        </button>

        <button
          onClick={handleRestore}
          disabled={busy}
          className="w-full py-3 mt-2 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Restore purchases
        </button>

        {/* Required legal disclosure for App Store compliance */}
        <p className="text-[10px] text-white/25 text-center leading-relaxed mt-4 px-2">
          Payment is charged to your Apple ID at confirmation. Subscription renews automatically
          for $4.99/month unless canceled at least 24 hours before the end of the period. Manage
          or cancel anytime in your App Store account settings. See our{' '}
          <span className="text-gold/60" onClick={() => navigate('/terms')}>Terms</span> and{' '}
          <span className="text-gold/60" onClick={() => navigate('/privacy')}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  )
}
