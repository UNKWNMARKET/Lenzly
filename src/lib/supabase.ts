import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdmtiyyfljzwveaowjxq.supabase.co'
const supabaseAnonKey = 'sb_publishable_1QS2OxeITYGN0E8d1QNeQw_DHRuVByw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  username: string
  name: string
  avatar_url: string | null
  bio: string | null
  specialty: string[]
  location: string | null
  lat: number | null
  lng: number | null
  is_pro: boolean
  pro_expires_at: string | null
  followers_count: number
  following_count: number
  posts_count: number
  created_at: string
}

export type Post = {
  id: string
  user_id: string
  image_url: string
  caption: string | null
  location_name: string | null
  lat: number | null
  lng: number | null
  tags: string[]
  likes_count: number
  comments_count: number
  category: string
  created_at: string
  profiles?: Profile
}
