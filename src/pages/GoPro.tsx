import { useState } from 'react'
import { useLocation } from 'wouter'
import { ChevronLeft, Camera, Check, Search, TrendingUp, BadgeCheck, Zap, MapPin } from 'lucide-react'
import { usePro } from '@/contexts/ProContext'
import { toast } from 'sonner'

const PRO_FEATURES = [
  { icon: BadgeCheck, title: 'Verified camera badge', desc: 'The gold camera emblem next to your name across LENZLY' },
  { icon: Search, title: 'Appear first in brand searches', desc: 'Pro members rank at the top when companies look for photographers' },
  { icon: TrendingUp, title: 'Priority discovery', desc: 'Get found by brands, publications, and clients before everyone else' },
  { icon: Zap, title: 'Unlimited photo spots', desc: 'Save and share unlimited locations with the community' },
  { icon: MapPin, title: 'Featured on the map', desc: 'Your pin stands out to brands browsing the photographer map' },
]

export default function GoPro() {
  const [, navigate] = useLocation()
  const { isProMember, restore } = usePro()
  const [busy, setBusy] = useState(false)

  const handleRestore = async () => {
    setBusy(true)
    const ok = await restore()
    toast[ok ? 'success' : 'info'](ok ? 'Pro restored!' : 'No previous purchases found.')
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-lenz-bg pb-24 safe-top">
      <header className="sticky top-0 z-40 glass-dark px-4 py-3 flex items-center gap-3 safe-top">
        <button onClick={() => navigate('/settings')} className="p-1 -ml-1">
          <ChevronLeft size={22} className="text-white/70" />
        </button>
        <h2 className="text-sm font-bold tracking-widest uppercase text-white">LENZLY Pro</h2>
      </header>

      <div className="px-5 pt-6">
        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gold flex items-center justify-center mb-4">
            <Camera size={38} className="text-lenz-bg" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold gold-text tracking-wide">Go Pro</h1>
          <p className="text-sm text-white/40 mt-2 max-w-xs">
            Get verified, get discovered, and unlock everything LENZLY has to offer.
          </p>
        </div>

        {isProMember ? (
          <div className="bg-gold/10 border border-gold/30 rounded-2xl p-5 text-center">
            <BadgeCheck size={28} className="text-gold mx-auto mb-2" />
            <p className="text-white font-semibold">You're a Pro member</p>
            <p className="text-xs text-white/40 mt-1">Thank you for supporting LENZLY.</p>
          </div>
        ) : (
          <>
            {/* Features */}
            <div className="space-y-3 mb-7">
              {PRO_FEATURES.map(f => (
                <div key={f.title} className="flex items-start gap-3 bg-lenz-card border border-lenz-border rounded-xl p-3.5">
                  <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                    <f.icon size={16} className="text-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                      {f.title}
                      <Check size={13} className="text-gold" />
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price + CTA */}
            <div className="text-center mb-3">
              <p className="text-3xl font-bold text-white">$4.99<span className="text-base font-medium text-white/40">/month</span></p>
              <p className="text-[11px] text-white/30 mt-1">Cancel anytime in your Apple account settings</p>
            </div>

            <button
              onClick={() => navigate('/pro/checkout')}
              disabled={busy}
              className="btn-primary w-full py-4 text-sm font-bold tracking-wider disabled:opacity-50"
            >
              Subscribe to Pro
            </button>

            <button
              onClick={handleRestore}
              disabled={busy}
              className="w-full py-3 mt-2 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Restore purchases
            </button>

            {/* Required legal links for App Store compliance */}
            <p className="text-[10px] text-white/25 text-center leading-relaxed mt-4 px-2">
              Payment is charged to your Apple ID. Subscription renews automatically for $4.99/month
              unless canceled at least 24 hours before the end of the period. Manage or cancel in
              your App Store account settings. See our{' '}
              <span className="text-gold/60" onClick={() => navigate('/terms')}>Terms</span> and{' '}
              <span className="text-gold/60" onClick={() => navigate('/privacy')}>Privacy Policy</span>.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
