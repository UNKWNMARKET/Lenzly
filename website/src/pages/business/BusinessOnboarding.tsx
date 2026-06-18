import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, Users, Camera, ArrowRight, Check, Lock, Eye, EyeOff, Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const PHOTOGRAPHY_TYPES = ['Editorial', 'Commercial', 'Events', 'Product', 'Fashion', 'Campaign', 'Portrait', 'Real Estate']
const TEAM_SIZES = ['1–10', '11–50', '51–200', '200+']
const BUDGETS = ['Under $500', '$500–$2k', '$2k–$10k', '$10k+']

export default function BusinessOnboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: password
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Step 2: company profile
  const [company, setCompany] = useState('')
  const [description, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [website, setWebsite] = useState('')

  // Step 3: photography needs
  const [needs, setNeeds] = useState<string[]>([])
  const [budget, setBudget] = useState('')

  function toggleNeed(n: string) {
    setNeeds(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setError(''); setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); setLoading(false); return }
    setLoading(false)
    setStep(2)
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim()) { setError('Company name is required'); return }
    setError('')
    setStep(3)
  }

  async function handleFinish() {
    setLoading(true)
    // Save business profile
    await supabase.from('business_profiles').upsert({
      user_id: user?.id,
      email: user?.email,
      company,
      description,
      location,
      team_size: teamSize,
      website,
      photography_needs: needs,
      budget,
      onboarding_complete: true,
    }, { onConflict: 'user_id' })

    setLoading(false)
    navigate('/business')
  }

  const steps = [
    { n: 1, label: 'Secure your account' },
    { n: 2, label: 'Your company' },
    { n: 3, label: 'Photography needs' },
  ]

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 py-12 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gold/5 blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-[17px] font-black tracking-[0.25em] gold-text">LENZLY</span>
          <div className="mt-4 mb-2">
            <h1 className="text-2xl font-serif text-white">Welcome aboard</h1>
            <p className="text-sm text-white/35 mt-1">Let's set up your business profile</p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s.n ? 'bg-gold text-lenz-bg' :
                  step === s.n ? 'bg-gold/20 border-2 border-gold text-gold' :
                  'bg-white/5 border border-white/10 text-white/25'
                }`}>
                  {step > s.n ? <Check size={13} /> : s.n}
                </div>
                <span className={`text-xs mt-1.5 font-medium whitespace-nowrap ${step === s.n ? 'text-white/70' : 'text-white/20'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-16 h-px mx-2 mb-5 transition-colors ${step > s.n ? 'bg-gold/40' : 'bg-white/8'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Password */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="card p-8 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Lock size={18} className="text-gold" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Set your password</h2>
                <p className="text-xs text-white/35">Replace the temporary password with one you'll remember</p>
              </div>
            </div>

            <div className="relative">
              <input type={showPass ? 'text' : 'password'} placeholder="New password" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={8}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 pr-11 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50" />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <input type={showPass ? 'text' : 'password'} placeholder="Confirm password" value={confirm}
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
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gold text-lenz-bg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
              Continue <ArrowRight size={15} />
            </button>
          </form>
        )}

        {/* Step 2: Company profile */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="card p-8 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Building2 size={18} className="text-gold" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Your company</h2>
                <p className="text-xs text-white/35">Tell photographers about your brand</p>
              </div>
            </div>

            <input placeholder="Company name *" value={company} onChange={e => setCompany(e.target.value)} required
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50" />

            <textarea placeholder="Short description — what does your company do? (optional)" value={description}
              onChange={e => setBio(e.target.value)} rows={3}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 resize-none" />

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                <input placeholder="City / Location" value={location} onChange={e => setLocation(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50" />
              </div>
              <div className="relative">
                <Upload size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                <input placeholder="Website URL" value={website} onChange={e => setWebsite(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50" />
              </div>
            </div>

            <div>
              <p className="text-xs text-white/30 mb-2 flex items-center gap-1.5"><Users size={12} /> Team size</p>
              <div className="grid grid-cols-4 gap-2">
                {TEAM_SIZES.map(s => (
                  <button key={s} type="button" onClick={() => setTeamSize(s)}
                    className={`py-2.5 rounded-xl text-xs font-medium transition-all border ${teamSize === s ? 'bg-gold/15 border-gold/40 text-gold' : 'border-white/8 text-white/35 hover:border-white/20'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit"
              className="w-full py-3.5 rounded-xl bg-gold text-lenz-bg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90">
              Continue <ArrowRight size={15} />
            </button>
          </form>
        )}

        {/* Step 3: Photography needs */}
        {step === 3 && (
          <div className="card p-8 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Camera size={18} className="text-gold" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Photography needs</h2>
                <p className="text-xs text-white/35">Help us match you with the right photographers</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-white/30 mb-2">What type of photography do you need? (select all that apply)</p>
              <div className="flex flex-wrap gap-2">
                {PHOTOGRAPHY_TYPES.map(n => (
                  <button key={n} type="button" onClick={() => toggleNeed(n)}
                    className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all border ${needs.includes(n) ? 'bg-gold/15 border-gold/40 text-gold' : 'border-white/8 text-white/35 hover:border-white/20'}`}>
                    {needs.includes(n) && <Check size={10} className="inline mr-1" />}{n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-white/30 mb-2">Typical project budget</p>
              <div className="grid grid-cols-2 gap-2">
                {BUDGETS.map(b => (
                  <button key={b} type="button" onClick={() => setBudget(b)}
                    className={`py-2.5 rounded-xl text-xs font-medium transition-all border ${budget === b ? 'bg-gold/15 border-gold/40 text-gold' : 'border-white/8 text-white/35 hover:border-white/20'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleFinish} disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gold text-lenz-bg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 mt-2">
              {loading ? 'Setting up your dashboard…' : <>Go to Dashboard <ArrowRight size={15} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
