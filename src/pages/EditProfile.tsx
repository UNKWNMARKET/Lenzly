import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { ChevronLeft, Camera, Check, MapPin, Globe, Loader } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const ALL_SPECIALTIES = [
  'Portrait', 'Wedding', 'Landscape', 'Street', 'Commercial',
  'Concert', 'Fashion', 'Architecture', 'Travel', 'Product',
  'Editorial', 'Lifestyle', 'Sports', 'Documentary', 'Nature',
]

export default function EditProfile() {
  const [, navigate] = useLocation()
  const { user, profile, refreshProfile } = useAuth()

  // ── Form fields ──────────────────────────────────────────────────────────────
  const [name, setName] = useState(profile?.name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [location, setLocation] = useState(profile?.location ?? '')
  const [website, setWebsite] = useState(profile?.website ?? '')
  const [specialties, setSpecialties] = useState<string[]>(profile?.specialty ?? [])
  const [saving, setSaving] = useState(false)

  // ── Photo upload ─────────────────────────────────────────────────────────────
  const [avatarPreview, setAvatarPreview]   = useState<string | null>(null)
  const [coverPreview,  setCoverPreview]    = useState<string | null>(null)
  const [newAvatarUrl,  setNewAvatarUrl]    = useState<string | null>(null)
  const [newCoverUrl,   setNewCoverUrl]     = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover,  setUploadingCover]  = useState(false)

  // ── Username restriction ─────────────────────────────────────────────────────
  const usernameChanged = !!profile && username.toLowerCase() !== (profile.username ?? '').toLowerCase()

  const canChangeUsername = (): boolean => {
    const lastChanged = profile?.username_changed_at
    if (!lastChanged) return true
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    return new Date(lastChanged) < sixMonthsAgo
  }

  const nextChangeDate = (): string => {
    const lastChanged = profile?.username_changed_at
    if (!lastChanged) return ''
    const d = new Date(lastChanged)
    d.setMonth(d.getMonth() + 6)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const usernameBlocked = usernameChanged && !canChangeUsername()

  // ── Sync form when profile loads ─────────────────────────────────────────────
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '')
      setUsername(profile.username ?? '')
      setBio(profile.bio ?? '')
      setLocation(profile.location ?? '')
      setWebsite(profile.website ?? '')
      setSpecialties(profile.specialty ?? [])
    }
  }, [profile?.id])

  // ── Image upload handler ─────────────────────────────────────────────────────
  const handleImageFile = async (file: File, type: 'avatar' | 'cover') => {
    if (!user) return

    const localUrl = URL.createObjectURL(file)
    if (type === 'avatar') { setAvatarPreview(localUrl); setUploadingAvatar(true) }
    else                   { setCoverPreview(localUrl);  setUploadingCover(true) }

    const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/${type}-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (error) {
      toast.error('Upload failed: ' + error.message)
      if (type === 'avatar') { setAvatarPreview(null); setNewAvatarUrl(null) }
      else                   { setCoverPreview(null);  setNewCoverUrl(null) }
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      if (type === 'avatar') setNewAvatarUrl(data.publicUrl)
      else                   setNewCoverUrl(data.publicUrl)
    }

    if (type === 'avatar') setUploadingAvatar(false)
    else                   setUploadingCover(false)
  }

  const toggleSpecialty = (s: string) =>
    setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim())     { toast.error('Name is required');     return }
    if (!username.trim()) { toast.error('Username is required'); return }
    if (!user)            { toast.error('Not signed in');        return }

    if (usernameBlocked) {
      toast.error(`You can change your username again on ${nextChangeDate()}`)
      return
    }

    setSaving(true)

    const isFirstSave = !profile

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      id:        user.id,
      name:      name.trim(),
      username:  username.trim().toLowerCase(),
      bio:       bio.trim() || null,
      location:  location.trim() || null,
      website:   website.trim() || null,
      specialty: specialties,
    }

    if (newAvatarUrl) updateData.avatar_url = newAvatarUrl
    if (newCoverUrl)  updateData.cover_url  = newCoverUrl

    if (!isFirstSave && usernameChanged && canChangeUsername()) {
      updateData.username_changed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(updateData, { onConflict: 'id' })

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }

    await refreshProfile()
    toast.success('Profile updated!')
    setSaving(false)
    navigate('/profile')
  }

  // ── Derived display values ────────────────────────────────────────────────────
  const displayAvatar = avatarPreview ?? profile?.avatar_url
  const displayCover  = coverPreview  ?? profile?.cover_url

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
          disabled={saving || usernameBlocked}
          className="text-gold font-semibold text-sm disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      <div className="px-4 pt-6 space-y-6">

        {/* Avatar / Cover — uses <label> overlay so iOS WKWebView file picker triggers reliably */}
        <div className="relative">
          {/* Cover photo */}
          <label className="block w-full h-28 rounded-2xl overflow-hidden bg-lenz-card border border-lenz-border relative cursor-pointer">
            {displayCover
              ? <img src={displayCover} alt="cover" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-lenz-card to-black" />
            }
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              {uploadingCover
                ? <Loader size={18} className="text-white animate-spin" />
                : <div className="flex items-center gap-2 text-white text-xs font-medium">
                    <Camera size={15} />
                    Change Cover
                  </div>
              }
            </div>
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f, 'cover') }}
            />
          </label>

          {/* Avatar */}
          <div className="absolute -bottom-5 left-4">
            <label className="relative block cursor-pointer">
              <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-lenz-bg bg-lenz-card">
                {displayAvatar
                  ? <img src={displayAvatar} alt={name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl font-bold">
                      {name.charAt(0).toUpperCase() || '?'}
                    </div>
                }
              </div>
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                {uploadingAvatar
                  ? <Loader size={13} className="text-white animate-spin" />
                  : <Camera size={13} className="text-white" />
                }
              </div>
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f, 'avatar') }}
              />
            </label>
          </div>
        </div>

        {/* Spacer for avatar overflow */}
        <div className="h-6" />

        {/* Display Name */}
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
          <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-2">
            Username
            {profile?.username_changed_at && canChangeUsername() && (
              <span className="ml-2 normal-case font-normal text-white/25">· 1 change per 6 months</span>
            )}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_.]/gi, ''))}
              placeholder="yourname.lens"
              className={`w-full bg-lenz-card border rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors ${
                usernameBlocked
                  ? 'border-red-500/40 focus:border-red-400/60'
                  : 'border-lenz-border focus:border-gold/50'
              }`}
            />
          </div>
          {usernameBlocked && (
            <p className="text-[11px] text-red-400 mt-1 pl-1">
              Username locked until {nextChangeDate()}
            </p>
          )}
          {!canChangeUsername() && !usernameChanged && (
            <p className="text-[11px] text-white/25 mt-1 pl-1">
              Next change available: {nextChangeDate()}
            </p>
          )}
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

        {/* Location / City */}
        <div>
          <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-2">City / Location</label>
          <div className="relative">
            <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Miami, FL"
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
            />
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-2">Website</label>
          <div className="relative">
            <Globe size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="url"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://yoursite.com"
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
            />
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

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || usernameBlocked}
          className="btn-primary w-full py-4 text-sm font-bold tracking-widest disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>

      </div>
    </div>
  )
}
