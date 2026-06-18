import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, type Profile } from '../lib/supabase'

const ADMIN_EMAIL = 'eisdorferjesse@gmail.com'

interface AuthCtx {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  isBusiness: boolean   // account signed up via the brand/business side
  isAdmin: boolean      // full-access owner account
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({} as AuthCtx)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isBusiness, setIsBusiness] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (uid: string) => {
    const [{ data: prof }, { data: biz }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('business_profiles').select('id').eq('user_id', uid).maybeSingle(),
    ])
    if (prof) setProfile(prof as Profile)
    setIsBusiness(!!biz)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id)
  }, [user, loadProfile])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) loadProfile(data.session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess)
      setUser(sess?.user ?? null)
      if (sess?.user) loadProfile(sess.user.id)
      else { setProfile(null); setIsBusiness(false) }
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setIsBusiness(false)
  }

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL

  return (
    <Ctx.Provider value={{ session, user, profile, loading, isBusiness, isAdmin, signOut, refreshProfile }}>
      {children}
    </Ctx.Provider>
  )
}
