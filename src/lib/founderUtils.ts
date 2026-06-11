import { supabase } from './supabase'

const CACHE_KEY = 'lenzly_founder_ids'
let founderIds: Set<string> | null = null
let loadPromise: Promise<Set<string>> | null = null

export async function loadFounderIds(): Promise<Set<string>> {
  if (founderIds) return founderIds
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        founderIds = new Set(JSON.parse(cached))
        return founderIds
      }
    } catch {}

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(100)

    const ids = (data ?? []).map((p: any) => p.id)
    founderIds = new Set(ids)

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(ids))
    } catch {}

    return founderIds
  })()

  return loadPromise
}

export function isFounder(userId: string): boolean {
  return founderIds?.has(userId) ?? false
}

export async function sendFounderNotificationIfNeeded(userId: string): Promise<void> {
  const ids = await loadFounderIds()
  if (!ids.has(userId)) return

  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'founder')
    .maybeSingle()

  if (existing) return

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'founder',
    actor_id: null,
    message: 'Thank you for being a founding member — we appreciate you! 🙏 You have been gifted an exclusive OG badge.',
    read: false,
  })
}
