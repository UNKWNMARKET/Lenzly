import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL || 'https://zdmtiyyfljzwveaowjxq.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1QS2OxeITYGN0E8d1QNeQw_DHRuVByw'
export const supabase = createClient(url, key)
