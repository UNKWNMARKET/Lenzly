import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// Returns the set of user ids the current user should never see — people they
// blocked AND people who blocked them (bidirectional). Backed by the
// hidden_user_ids() RPC so the block direction is never leaked to the client.
export function useBlockedUsers() {
  const { user } = useAuth()
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) { setBlockedIds(new Set()); setLoaded(true); return }
    const { data } = await supabase.rpc('hidden_user_ids')
    setBlockedIds(new Set((data ?? []).map((r: any) => (typeof r === 'string' ? r : r.hidden_user_ids))))
    setLoaded(true)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  return { blockedIds, loaded, refresh }
}
