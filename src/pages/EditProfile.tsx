import { useState } from 'react'
import { useLocation } from 'wouter'
import { ChevronLeft, Camera, Check, MapPin, Globe, AtSign } from 'lucide-react'
import { currentUser } from '@/data/mockData'
import { toast } from 'sonner'

const ALL_SPECIALTIES = [
  'Portrait', 'Wedding', 'Landscape', 'Street', 'Commercial',
  'Concert', 'Fashion', 'Architecture', 'Travel', 'Product',
  'Editorial', 'Lifestyle', 'Sports', 'Documentary', 'Nature',
]

export default function EditProfile() {
  const [, navigate] = useLocation()
  const u = currentUser

  const [name, setName] = useState(u.name)
  const [username, setUsername] = useState(u.username)
  const [bio, setBio] = useState(u.bio)
  const [location, setLocation] = useState(u.location)
  const [social, setSocial] = useState(u.instagram)
  const [portfolio, setPortfolio] = useState(u.portfolio)
  const [priceMin, setPriceMin] = useState('200')
  const [priceMax, setPriceMax] = useState('800')
  const [specialties, setSpecialties] = useState<string[]>(u.specialty)
  const [available, setAvailable] = useState(u.available)
  const [secondShooter, setSecondShooter] = useState(u.secondShooter)
  const [saving, setSaving] = useState(false)

  const toggleSpecialty = (s: string) => {
    setSpecialties(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return }
    if (!username.trim()) { toast.error('Username is required'); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    toast.success('Profile updated!')
    setSaving(false)
    navigate('/profile')
  }

  return (
    <div className="min-h-screen bg-lenz-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 py-3 flex items-center justify-between safe-top">
        <button onClick={() => navigate('/profile')} className="p-2 -ml-2">
          <ChevronLeft size={22} className="text-white/70" />
        </button>
        <h2 className="text-sm font-bold tracking-widest uppercase text-white">Edit Profile</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-gold font-semibold text-sm disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      <div className="px-4 pt-6 space-y-6">

        {/* Avatar / Cover */}
        <div className="relative">
          {/* Cover */}
          <div className="h-28 rounded-2xl overflow-hidden bg-lenz-card border border-lenz-border relative group cursor-pointer">
            <img src={u.coverPhoto} alt="cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 text-white text-xs font-medium">
                <Camera size={15} />
                Change Cover
              </div>
            </div>
          </div>
          {/* Avatar */}
          <div className="absolute -bottom-5 left-4">
            <div className="relative cursor-pointer group">
              <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-lenz-bg">
                <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={13} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Spacer for avatar overflow */}
        <div className="h-6" />

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-2">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your Name"
            className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-2">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_.]/gi, ''))}
              placeholder="yourname.lens"
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell your story..."
            rows={3}
            maxLength={200}
            className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors resize-none"
          />
          <p className="text-[10px] text-white/20 text-right mt-1">{bio.length}/200</p>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-2">Location</label>
          <div className="relative">
            <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="City, State"
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
            />
          </div>
        </div>

        {/* Social Handle */}
        <div>
          <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-2">Social Handle</label>
          <div className="relative">
            <AtSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={social}
              onChange={e => setSocial(e.target.value)}
              placeholder="@yoursocial"
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
            />
          </div>
        </div>

        {/* Portfolio */}
        <div>
          <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-2">Portfolio URL</label>
          <div className="relative">
            <Globe size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={portfolio}
              onChange={e => setPortfolio(e.target.value)}
              placeholder="yourportfolio.com"
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
            />
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-2">Day Rate (USD)</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
              <input
                type="number"
                value={priceMin}
                onChange={e => setPriceMin(e.target.value)}
                placeholder="Min"
                className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
              />
            </div>
            <span className="text-white/30 text-sm">to</span>
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
              <input
                type="number"
                value={priceMax}
                onChange={e => setPriceMax(e.target.value)}
                placeholder="Max"
                className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div>
          <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-2">
            Specialties <span className="text-white/20 normal-case font-normal">(select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_SPECIALTIES.map(s => {
              const active = specialties.includes(s)
              return (
                <button
                  key={s}
                  onClick={() => toggleSpecialty(s)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                    active
                      ? 'bg-gold/15 border-gold/50 text-gold'
                      : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25'
                  }`}
                >
                  {active && <Check size={10} />}
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-2">Availability</label>

          <div className="flex items-center justify-between p-4 rounded-xl bg-lenz-card border border-lenz-border">
            <div>
              <p className="text-sm font-medium text-white">Available for Hire</p>
              <p className="text-xs text-white/40 mt-0.5">Show "Available" badge on your profile</p>
            </div>
            <button
              onClick={() => setAvailable(!available)}
              className={`w-12 h-6 rounded-full transition-colors relative ${available ? 'bg-gold' : 'bg-white/10'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${available ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-lenz-card border border-lenz-border">
            <div>
              <p className="text-sm font-medium text-white">2nd Shooter</p>
              <p className="text-xs text-white/40 mt-0.5">Open to second-shooting with other photographers</p>
            </div>
            <button
              onClick={() => setSecondShooter(!secondShooter)}
              className={`w-12 h-6 rounded-full transition-colors relative ${secondShooter ? 'bg-gold' : 'bg-white/10'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${secondShooter ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Save button (bottom) */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full py-4 text-sm font-bold tracking-widest disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>

      </div>
    </div>
  )
}
