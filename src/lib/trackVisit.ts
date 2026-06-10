import { supabase } from './supabase'

function getVisitorId(): string {
  const KEY = 'lenzly_visitor_id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`)
    localStorage.setItem(KEY, id)
  }
  return id
}

function recentlyTracked(path: string): boolean {
  const KEY = 'lenzly_last_visit'
  try {
    const raw = sessionStorage.getItem(KEY)
    const map: Record<string, number> = raw ? JSON.parse(raw) : {}
    const last = map[path] || 0
    if (Date.now() - last < 30 * 60 * 1000) return true
    map[path] = Date.now()
    sessionStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    /* ignore storage failures */
  }
  return false
}

export async function trackVisit(path: string) {
  try {
    if (recentlyTracked(path)) return
    const { data } = await supabase.auth.getUser()
    await supabase.from('site_visits').insert({
      visitor_id: getVisitorId(),
      path,
      platform: 'app',
      user_id: data.user?.id ?? null,
    })
  } catch {
    /* analytics must never break the app */
  }
}
