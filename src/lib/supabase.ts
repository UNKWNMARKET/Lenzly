import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,       // keep session in localStorage across restarts
    autoRefreshToken: true,     // silently renew token before it expires
    detectSessionInUrl: false,  // required for Capacitor / WKWebView
    storageKey: 'lenzly_auth',  // consistent storage key
  },
})

export type Profile = {
  id: string
  username: string
  name: string
  avatar_url: string | null
  cover_url: string | null
  bio: string | null
  specialty: string[]
  location: string | null
  website: string | null
  lat: number | null
  lng: number | null
  is_pro: boolean
  pro_expires_at: string | null
  followers_count: number
  following_count: number
  posts_count: number
  created_at: string
  username_changed_at: string | null
  onboarded?: boolean
  available: boolean
  second_shooter: boolean
  price_range: string | null
  private_account?: boolean
  show_location?: boolean
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
