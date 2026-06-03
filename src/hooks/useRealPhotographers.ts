import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

import type { Photographer } from '@/data/mockData'

// Real profiles use the same shape as mock photographers + an isReal flag,
// so existing cards / profile UI render them identically.
export type RealPhotographer = Photographer & { isReal: true; private_account: boolean }

function mapProfile(p: any): RealPhotographer {
  return {
    id: p.id,
    name: p.name ?? p.username ?? 'Photographer',
    username: p.username ?? '',
    avatar: p.avatar_url ?? '',
    coverPhoto: p.cover_url ?? '',
    bio: p.bio ?? '',
    specialty: p.specialty ?? [],
    location: p.location ?? '',
    city: p.location ?? '',
    lat: p.lat ?? 0,
    lng: p.lng ?? 0,
    followers: p.followers_count ?? 0,
    following: p.following_count ?? 0,
    posts: p.posts_count ?? 0,
    hired: 0,
    rating: 0,
    verified: false,
    pro: p.is_pro ?? false,
    secondShooter: p.second_shooter ?? false,
    instagram: '',
    portfolio: p.website ?? '',
    photos: [],
    available: p.available ?? false,
    priceRange: p.price_range ?? '',
    isReal: true,
    private_account: p.private_account ?? false,
  }
}

// Fetch all real user profiles to display as photographers.
export function useRealPhotographers(options?: { refreshKey?: number }) {
  const [photographers, setPhotographers] = useState<RealPhotographer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) console.error('[useRealPhotographers]', error.message, error.code)
        if (data) setPhotographers(data.map(mapProfile))
        setLoading(false)
      })
  }, [options?.refreshKey])

  return { photographers, loading }
}

// Fetch a single real profile by id (returns null if not found / not a UUID).
export function useRealPhotographer(id: string | undefined) {
  const [photographer, setPhotographer] = useState<RealPhotographer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    // Mock ids aren't UUIDs — skip the DB lookup for those
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (!isUuid) { setLoading(false); return }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPhotographer(mapProfile(data))
        setLoading(false)
      })
  }, [id])

  return { photographer, loading }
}
