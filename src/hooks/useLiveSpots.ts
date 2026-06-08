import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type LiveSpot = {
  id: string
  name: string
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
    const { data, error } = await supabase
      .from('photo_spots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) { console.error('[useLiveSpots]', error.message); setLoading(false); return }
    setSpots((data ?? []) as LiveSpot[])
    setLoading(false)
  }, [limit])

  useEffect(() => {
    fetchSpots()

    // Re-fetch when photo_spots change OR when posts are deleted (which affects spot counts)
    const channel = supabase
      .channel('photo_spots_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photo_spots' }, () => fetchSpots())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, () => fetchSpots())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => fetchSpots())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchSpots])

  return { spots, loading, refresh: fetchSpots }
}
