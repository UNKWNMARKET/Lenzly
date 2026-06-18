import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type LiveSpot = {
  id: string        // first post id for this location
  name: string      // location_name
  lat: number
  lng: number
  city: string | null
  state: string | null
  location_name: string | null
  category: string
  cover_image_url: string | null
  photo_count: number
  contributor_count: number
  ai_score: number
  tags: string[]
  created_at: string
  updated_at: string
  discoverer_username: string | null
  discoverer_avatar: string | null
}

export function useLiveSpots(limit = 200) {
  const [spots, setSpots] = useState<LiveSpot[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSpots = useCallback(async () => {
    // Pull all posts that have a location tag, newest first, with author profile
    const { data, error } = await supabase
      .from('posts')
      .select('id, location_name, image_url, lat, lng, category, tags, created_at, user_id, profiles(username, avatar_url)')
      .not('location_name', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) { console.error('[useLiveSpots]', error.message); setLoading(false); return }

    // Group by location_name — first post per location becomes the cover
    const seen = new Map<string, LiveSpot>()
    for (const post of (data ?? []) as any[]) {
      const loc = post.location_name?.trim()
      if (!loc) continue
      const key = loc.toLowerCase()
      if (seen.has(key)) {
        // Just increment count
        seen.get(key)!.photo_count++
      } else {
        const prof = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
        seen.set(key, {
          id: post.id,
          name: loc.split(',')[0].trim(),
          lat: post.lat ?? 0,
          lng: post.lng ?? 0,
          city: null,
          state: null,
          location_name: loc,
          category: post.category ?? 'Nature',
          cover_image_url: post.image_url ?? null,
          photo_count: 1,
          contributor_count: 1,
          ai_score: 50,
          tags: post.tags ?? [],
          created_at: post.created_at,
          updated_at: post.created_at,
          discoverer_username: prof?.username ?? null,
          discoverer_avatar: prof?.avatar_url ?? null,
        })
      }
    }

    setSpots(Array.from(seen.values()).slice(0, limit))
    setLoading(false)
  }, [limit])

  useEffect(() => {
    fetchSpots()

    const channel = supabase
      .channel('community_discovered_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => fetchSpots())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, () => fetchSpots())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, () => fetchSpots())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchSpots])

  return { spots, loading, refresh: fetchSpots }
}
