import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Camera, Check, UserPlus, MapPin, Compass, Users, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRealPhotographers } from '@/hooks/useRealPhotographers'

type Step = 'welcome' | 'follow'

export default function Onboarding() {
  const [, navigate] = useLocation()
  const { user, refreshProfile } = useAuth()
  const { photographers, loading } = useRealPhotographers()
  const [step, setStep] = useState<Step>('welcome')
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const [finishing, setFinishing] = useState(false)

  // Don't suggest the user themselves; show the most-followed real accounts
  const suggestions = photographers.filter(p => p.id !== user?.id).slice(0, 12)

  const toggleFollow = async (id: string) => {
    if (!user) return
    const next = new Set(following)
    if (next.has(id)) {
      next.delete(id)
      setFollowing(next)
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', id)
    } else {
      next.add(id)
      setFollowing(next)
      const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: id })
      if (error) { next.delete(id); setFollowing(new Set(next)) }
    }
  }

  const finish = async () => {
    if (!user) return
    setFinishing(true)
    await supabase.from('profiles').update({ onboarded: true }).eq('id', user.id)
    await refreshProfile()
    navigate('/')
  }

  // Safety: if somehow opened without a user, bounce to login
  useEffect(() => {
    if (user === null) navigate('/auth/login')
  }, [user, navigate])

  if (step === 'welcome') {
    return (
      <div className="min-h-[100dvh] bg-lenz-bg flex flex-col safe-top safe-bottom px-6">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-gold flex items-center justify-center mb-2">
            <Camera size={40} className="text-lenz-bg" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold gold-text tracking-wide">Welcome to LENZLY</h1>
            <p className="text-white/45 text-sm mt-3 max-w-xs mx-auto leading-relaxed">
              The platform built for photographers — discover stunning spots, share your work, and connect with creatives near you.
            </p>
          </div>

          <div className="w-full max-w-sm space-y-3 mt-4">
            {[
              { icon: Compass, title: 'Discover photogenic spots', desc: 'Thousands of locations across all 50 states' },
              { icon: MapPin, title: 'Share your spots', desc: 'Post 24-hour stories from where you shoot' },
              { icon: Users, title: 'Find photographers', desc: 'Connect, follow, and get hired by brands' },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-3 bg-lenz-card border border-lenz-border rounded-2xl p-3.5 text-left">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                  <f.icon size={18} className="text-gold" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setStep('follow')}
          className="w-full py-4 rounded-2xl bg-gold text-lenz-bg font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform mb-4"
        >
          Get Started <ArrowRight size={18} />
        </button>
      </div>
    )
  }

  // ── Follow step ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-lenz-bg flex flex-col safe-top safe-bottom">
      <div className="px-6 pt-6 pb-3">
        <h2 className="text-2xl font-bold text-white tracking-wide">Follow photographers</h2>
        <p className="text-white/45 text-sm mt-1.5">Build your feed — follow a few accounts to get started.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="space-y-2.5 px-2 pt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-12 h-12 rounded-full bg-lenz-card animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="w-28 h-3 bg-lenz-card rounded animate-pulse" />
                  <div className="w-20 h-2 bg-lenz-card rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-16 px-8">
            <p className="text-white/40 text-sm">No photographers to suggest yet.</p>
            <p className="text-white/25 text-xs mt-2">You'll be one of the first — start posting and others will follow you.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {suggestions.map(p => {
              const isFollowing = following.has(p.id)
              return (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-lenz-card overflow-hidden border border-lenz-border shrink-0">
                    {p.avatar
                      ? <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white/40 font-bold">{(p.name || '?')[0].toUpperCase()}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                      {p.pro && <span className="text-[8px] font-bold tracking-widest text-lenz-bg bg-gold px-1.5 py-0.5 rounded-full shrink-0">PRO</span>}
                    </div>
                    {(p.username || p.location) && (
                      <p className="text-xs text-white/40 truncate">
                        {p.username ? `@${p.username}` : ''}{p.username && p.location ? ' · ' : ''}{p.location}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFollow(p.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      isFollowing ? 'bg-white/10 text-white/70' : 'bg-gold text-lenz-bg'
                    }`}
                  >
                    {isFollowing ? <><Check size={13} /> Following</> : <><UserPlus size={13} /> Follow</>}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-6 pb-4 pt-2 border-t border-lenz-border/40">
        <button
          onClick={finish}
          disabled={finishing}
          className="w-full py-4 rounded-2xl bg-gold text-lenz-bg font-bold text-base active:scale-95 transition-transform disabled:opacity-60"
        >
          {finishing ? 'Setting up…' : following.size > 0 ? `Continue · Following ${following.size}` : 'Skip for now'}
        </button>
      </div>
    </div>
  )
}
