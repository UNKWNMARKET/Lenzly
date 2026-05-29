import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'wouter'
import { Mail, Lock, User, Eye, EyeOff, AtSign, CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import AppLogo from '@/components/AppLogo'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'

async function checkUsernameAvailable(username: string): Promise<boolean> {
  // Case-insensitive exact match against ALL existing usernames.
  // Use a count query (head:true) so multiple matches never throw and
  // an empty result genuinely means the name is free.
  const uname = username.trim().toLowerCase()
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .ilike('username', uname)
  // If the query errors (e.g. RLS), do NOT assume available — surface it.
  if (error) throw error
  return (count ?? 0) === 0
}

export default function SignUp() {
  const [, navigate] = useLocation()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const latestUsername = useRef('')

  useEffect(() => {
    if (username.length < 3) { setUsernameStatus('idle'); return }
    setUsernameStatus('checking')
    latestUsername.current = username
    const timer = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(username)
        if (latestUsername.current !== username) return
        setUsernameStatus(available ? 'available' : 'taken')
      } catch {
        if (latestUsername.current !== username) return
        setUsernameStatus('error')
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [username])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (username.length < 3) { toast.error('Username must be at least 3 characters'); return }
    if (usernameStatus === 'taken') { toast.error('That username is already taken'); return }
    if (usernameStatus === 'checking') { toast.error('Please wait while we check your username'); return }
    if (usernameStatus === 'error') { toast.error('Could not verify username — please try again'); return }
    setLoading(true)
    try {
      const available = await checkUsernameAvailable(username)
      if (!available) {
        setUsernameStatus('taken')
        toast.error('That username was just taken — please choose another')
        setLoading(false)
        return
      }
    } catch {
      toast.error('Could not verify username availability. Please try again.')
      setLoading(false)
      return
    }
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, username: username.toLowerCase().trim() } },
    })
    if (authError) { toast.error(authError.message); setLoading(false); return }
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        username: username.toLowerCase().trim(),
        full_name: name,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'username' })
      if (profileError?.code === '23505') {
        setUsernameStatus('taken')
        toast.error('That username was just taken — please choose another')
        await supabase.auth.signOut()
        setLoading(false)
        return
      }
    }
    toast.success('Account created! Welcome to LENZLY.')
    navigate('/')
    setLoading(false)
  }

  const UsernameIndicator = () => {
    if (username.length < 3) return null
    if (usernameStatus === 'checking') return <Loader size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 animate-spin" />
    if (usernameStatus === 'available') return <CheckCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
    if (usernameStatus === 'taken') return <XCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400" />
    if (usernameStatus === 'error') return <AlertCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-400" />
    return null
  }

  const submitDisabled = loading || usernameStatus === 'taken' || usernameStatus === 'checking' || usernameStatus === 'error'

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="mb-8 text-center flex flex-col items-center gap-2">
        <AppLogo className="h-14" />
        <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase">Join the Photography Community</p>
      </div>
      <form onSubmit={handleSignUp} className="w-full max-w-sm space-y-3.5" autoComplete="on">
        <div className="relative">
          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" name="name" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors" />
        </div>
        <div className="space-y-1">
          <div className="relative">
            <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))} required className={`w-full bg-lenz-card border rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-white/25 outline-none transition-colors ${usernameStatus === 'available' ? 'border-emerald-500/50 focus:border-emerald-400' : usernameStatus === 'taken' ? 'border-red-500/50 focus:border-red-400' : 'border-lenz-border focus:border-gold/50'}`} />
            <UsernameIndicator />
          </div>
          {usernameStatus === 'available' && username.length >= 3 && <p className="text-[11px] text-emerald-400 pl-1">@{username} is available</p>}
          {usernameStatus === 'taken' && <p className="text-[11px] text-red-400 pl-1">@{username} is already taken</p>}
          {usernameStatus === 'error' && <p className="text-[11px] text-yellow-400 pl-1">Couldn't verify — tap the field and try again</p>}
        </div>
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="email" name="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" autoCapitalize="none" autoCorrect="off" className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors" />
        </div>
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-[10px] text-white/20 leading-relaxed">
          By joining you agree to our <Link href="/terms"><span className="text-gold/60 cursor-pointer">Terms</span></Link> and <Link href="/privacy"><span className="text-gold/60 cursor-pointer">Privacy Policy</span></Link>. Free to join. Pro features available for $5/month.
        </p>
        <button type="submit" disabled={submitDisabled} className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50">
          {loading ? 'Creating account...' : 'Join LENZLY Free'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-sm text-white/30">Already have an account? <Link href="/auth/login"><span className="text-gold hover:text-gold/80 font-medium cursor-pointer">Sign in</span></Link></p>
      </div>
    </div>
  )
}