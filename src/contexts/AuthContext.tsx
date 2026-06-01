import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, Profile } from '@/lib/supabase'
import { initOneSignal, logoutOneSignal } from '@/lib/onesignal'

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  deleteAccount: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  deleteAccount: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null)
  const [user, setUser]         = useState<User | null>(null)
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [loading, setLoading]   = useState(true)
  const settled = useRef(false)

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  useEffect(() => {
    // onAuthStateChange is the primary source of truth.
    // It fires immediately with the current session (if any),
    // which prevents the ProtectedRoute from ever seeing user=null
    // right after a successful signIn.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      setUser(sess?.user ?? null)
      if (sess?.user) {
        fetchProfile(sess.user.id)
        // Register this device for push, tied to the Supabase user id
        initOneSignal(sess.user.id)
      } else {
        setProfile(null)
      }
      // Only set loading=false once — on the very first auth state resolution
      if (!settled.current) {
        settled.current = true
        setLoading(false)
      }
    })

    // Fallback: if onAuthStateChange somehow doesn't fire within 3s, unblock loading
    const fallback = setTimeout(() => {
      if (!settled.current) {
        settled.current = true
        setLoading(false)
      }
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(fallback)
    }
  }, [])

  const signOut = async () => {
    await logoutOneSignal()
    await supabase.auth.signOut()
  }

  // Permanently erase the account. The RPC deletes the auth.users row, which
  // cascades to all the user's data, then we sign out the now-orphaned session.
  const deleteAccount = async () => {
    const { error } = await supabase.rpc('delete_my_account')
    if (error) throw error
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, deleteAccount, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
