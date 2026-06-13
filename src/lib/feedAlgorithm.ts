/**
 * Personalized feed algorithm.
 *
 * Builds a per-user interest profile from their engagement history
 * (likes, saves, posts), then scores and re-ranks feed posts so
 * content matching their interests floats to the top.
 *
 * All computation is client-side — no extra DB writes needed.
 */

import { supabase } from './supabase'
import type { Post } from './supabase'

interface TagWeights { [tag: string]: number }

const CACHE_KEY = 'lenzly_tag_weights'
const CACHE_TTL = 1000 * 60 * 30 // 30 min

function loadCached(): TagWeights | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch { return null }
}

function saveCache(weights: TagWeights) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: weights }))
  } catch {}
}

export async function buildTagWeights(userId: string): Promise<TagWeights> {
  const cached = loadCached()
  if (cached) return cached

  const weights: TagWeights = {}
  const bump = (tags: string[], score: number) => {
    for (const tag of tags) weights[tag] = (weights[tag] ?? 0) + score
  }

  // Liked posts — strong signal (weight 3)
  const { data: likes } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId)
    .limit(200)

  // Saved posts — strongest signal (weight 5)
  const { data: saves } = await supabase
    .from('saved_posts')
    .select('post_id')
    .eq('user_id', userId)
    .limit(100)

  // Own posts — strong identity signal (weight 4)
  const { data: ownPosts } = await supabase
    .from('posts')
    .select('tags')
    .eq('user_id', userId)
    .limit(50)

  const allPostIds = [
    ...new Set([
      ...(likes ?? []).map((l: any) => l.post_id),
      ...(saves ?? []).map((s: any) => s.post_id),
    ])
  ]

  if (allPostIds.length) {
    const { data: engagedPosts } = await supabase
      .from('posts')
      .select('id, tags')
      .in('id', allPostIds)

    for (const p of engagedPosts ?? []) {
      const isLiked = (likes ?? []).some((l: any) => l.post_id === p.id)
      const isSaved = (saves ?? []).some((s: any) => s.post_id === p.id)
      if (isSaved) bump(p.tags ?? [], 5)
      else if (isLiked) bump(p.tags ?? [], 3)
    }
  }

  for (const p of ownPosts ?? []) bump(p.tags ?? [], 4)

  saveCache(weights)
  return weights
}

export function scorePost(post: Post, weights: TagWeights): number {
  if (!post.tags?.length || !Object.keys(weights).length) return 0
  let score = 0
  for (const tag of post.tags) score += weights[tag] ?? 0
  // Recency bonus — posts < 24h get a bump
  const ageHours = (Date.now() - new Date(post.created_at).getTime()) / 3_600_000
  const recency = ageHours < 1 ? 2 : ageHours < 6 ? 1 : ageHours < 24 ? 0.5 : 0
  return score + recency
}

export function rankPosts(posts: Post[], weights: TagWeights): Post[] {
  if (!Object.keys(weights).length) return posts
  return [...posts].sort((a, b) => scorePost(b, weights) - scorePost(a, weights))
}

export function invalidateWeightCache() {
  sessionStorage.removeItem(CACHE_KEY)
}
