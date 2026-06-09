import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://zdmtiyyfljzwveaowjxq.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1QS2OxeITYGN0E8d1QNeQw_DHRuVByw'

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'lenzly_web_auth',
  },
})

export interface Profile {
  id: string
  username: string
  name: string
  avatar_url: string | null
  cover_url: string | null
  bio: string | null
  specialty: string[] | null
  location: string | null
  website: string | null
  is_pro: boolean
  available: boolean
  second_shooter: boolean
  price_range: string | null
  followers_count: number
  following_count: number
  posts_count: number
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  image_url: string
  caption: string | null
  location_name: string | null
  likes_count: number
  comments_count: number
  category: string
  created_at: string
  profiles?: Profile
}
