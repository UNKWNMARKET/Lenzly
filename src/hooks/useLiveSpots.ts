import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type LiveSpot = {
  id: string
  name: string
  lat: number
  lng: number
  category: string
  cover_image_url: string | null
  photo_count: number
  contributor_count: number
  ai_score: number
  tags: string[]
  created_at: string
  updated_at: string
}

export function useLiveSpots(limit = 20) {
  const [spots, setSpots] = useState<LiveSpot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSpots = async () => {
      const { data, error } = await supabase
        .from('photo_spots')
        .select('*')
        .order('ai_score', { ascending: false })
        .limit(limit)

      if (!error && data) setSpots(data as LiveSpot[])
      setLoading(false)
    }

    fetchSpots()

    // Real-time: re-fetch whenever any spot row changes (new post uploaded anywhere)
    const channel = supabase
      .channel('photo_spots_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'photo_spots' },
        () => fetchSpots()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [limit])

  return { spots, loading }
}
