import { supabase } from './supabase'

const CACHE_KEY = 'lenzly_founder_cutoff_v2'
let cutoffDate: string | null | undefined = undefined // undefined = not loaded yet
let loadPromise: Promise<string | null> | null = null

/**
 * Returns the created_at of the 100th earliest profile.
 * Any profile with created_at <= this value is a founding member.
 * Returns null if fewer than 100 profiles exist (all are founders).
 */
export async function getFounderCutoff(): Promise<string | null> {
  if (cutoffDate !== undefined) return cutoffDate
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    // Check sessionStorage cache
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.date && parsed.ts && Date.now() - parsed.ts < 1000 * 60 * 60) {
          cutoffDate = parsed.date
          return cutoffDate as string | null
        }
      }
    } catch {}

    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .order('created_at', { ascending: true })
      .range(99, 99)

    if (error) {
      // Don't cache failures — retry next time
      loadPromise = null
      cutoffDate = undefined
      return null
    }

    let date: string
    if (data && data.length > 0) {
      // 100+ profiles exist — use the 100th signup date as the cutoff
      date = data[0].created_at as string
    } else {
      // Fewer than 100 profiles total — every existing member is a founder
      // Use a far-future date so all current profiles pass the <= check
      date = '2099-01-01T00:00:00.000Z'
    }

    cutoffDate = date

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ date, ts: Date.now() }))
    } catch {}

    return date
  })()

  return loadPromise
}

export function isFounderByDate(profileCreatedAt: string | null | undefined): boolean {
  if (!profileCreatedAt || cutoffDate === undefined || cutoffDate === null) return false
  return profileCreatedAt <= cutoffDate
}

export async function isFounderAsync(profileCreatedAt: string | null | undefined): Promise<boolean> {
  if (!profileCreatedAt) return false
  const cutoff = await getFounderCutoff()
  if (!cutoff) return false
  return profileCreatedAt <= cutoff
}

export async function sendFounderNotificationIfNeeded(
  userId: string,
  profileCreatedAt: string,
): Promise<void> {
  const isOG = await isFounderAsync(profileCreatedAt)
  if (!isOG) return

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

export function invalidateFounderCache() {
  cutoffDate = undefined
  loadPromise = null
  try { sessionStorage.removeItem(CACHE_KEY) } catch {}
}
