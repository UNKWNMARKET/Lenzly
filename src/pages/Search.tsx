import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, Search as SearchIcon, X, MapPin, Compass } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useBlockedUsers } from '@/hooks/useBlockedUsers'
import { img } from '@/lib/image'

type UserResult = {
  id: string
  username: string | null
  name: string | null
  avatar_url: string | null
  location: string | null
  is_pro: boolean
  followers_count: number
}

export default function Search() {
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const { blockedIds } = useBlockedUsers()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const runSearch = useCallback(async (q: string) => {
    const term = q.trim()
    if (term.length < 1) { setUsers([]); setSearched(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, name, avatar_url, location, is_pro, followers_count')
      .or(`username.ilike.%${term}%,name.ilike.%${term}%`)
      .order('followers_count', { ascending: false })
      .limit(30)
    if (error) console.error('[Search]', error.message, error.code, error.details)
    const rows = (data ?? []).filter(u => u.id !== user?.id && !blockedIds.has(u.id))
    setUsers(rows as UserResult[])
    setLoading(false)
    setSearched(true)
  }, [user?.id, blockedIds])

  // Debounced search as the user types
  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 250)
    return () => clearTimeout(t)
  }, [query, runSearch])

  return (
    <div className="fixed inset-0 overflow-y-auto overscroll-none">
    <div className="min-h-full bg-lenz-bg">
      {/* Search bar header */}
      <header className="sticky top-0 z-40 glass-dark px-3 py-3 flex items-center gap-2 safe-top">
        <button onClick={() => navigate('/')} className="p-2 -ml-1 shrink-0">
          <ArrowLeft size={22} className="text-white/70" />
        </button>
        <div className="flex-1 relative">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search photographers, people…"
            className="w-full bg-lenz-card border border-lenz-border rounded-full pl-10 pr-9 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-gold/50 transition-colors"
          />
          {query && (
            <button onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
              <X size={12} className="text-white/60" />
            </button>
          )}
        </div>
      </header>

      <div className="pb-24">
        {/* Shortcut to spot/location search on Explore */}
        <button
          onClick={() => navigate('/explore')}
          className="flex items-center gap-3 w-full px-4 py-3.5 border-b border-lenz-border/50 active:bg-white/5"
        >
          <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
            <Compass size={17} className="text-gold" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-white">Search photo spots & locations</p>
            <p className="text-xs text-white/35 mt-0.5">Browse thousands of spots on Explore</p>
          </div>
        </button>

        {loading && (
          <div className="px-4 pt-4 space-y-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-lenz-border/30 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-lenz-card shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-lenz-card rounded" style={{ width: `${48 + (i * 13) % 30}%` }} />
                  <div className="h-2 bg-lenz-card rounded" style={{ width: `${30 + (i * 7) % 25}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && searched && users.length === 0 && (
          <div className="text-center py-16 px-8">
            <p className="text-white/40 text-sm">No people found for “{query}”</p>
            <p className="text-white/25 text-xs mt-2">Try a different name or username.</p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div>
            <p className="px-4 pt-4 pb-1 text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase">People</p>
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => navigate(`/photographer/${u.id}`)}
                className="flex items-center gap-3 w-full px-4 py-3 active:bg-white/5 transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-lenz-card overflow-hidden border border-lenz-border shrink-0">
                  {u.avatar_url
                    ? <img src={img.avatar(u.avatar_url)} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white/40 font-bold">{(u.name || u.username || '?')[0].toUpperCase()}</div>}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-white truncate">{u.name || u.username}</p>
                    {u.is_pro && <span className="text-[8px] font-bold tracking-widest text-lenz-bg bg-gold px-1.5 py-0.5 rounded-full shrink-0">PRO</span>}
                  </div>
                  <p className="text-xs text-white/40 truncate">
                    {u.username ? `@${u.username}` : ''}
                    {u.username && u.location ? ' · ' : ''}
                    {u.location ?? ''}
                  </p>
                </div>
                {u.followers_count > 0 && (
                  <span className="text-[11px] text-white/30 shrink-0">{u.followers_count.toLocaleString()} followers</span>
                )}
              </button>
            ))}
          </div>
        )}

        {!searched && !loading && (
          <div className="px-4 pt-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-lenz-card border border-lenz-border flex items-center justify-center mx-auto mb-3">
              <SearchIcon size={24} className="text-white/25" />
            </div>
            <p className="text-white/40 text-sm">Search for people</p>
            <p className="text-white/25 text-xs mt-1.5">Find by name or @username</p>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
