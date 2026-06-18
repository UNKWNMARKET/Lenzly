import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface BusinessProfile {
  id: string
  user_id: string
  company: string | null
  tagline: string | null
  description: string | null
  location: string | null
  website: string | null
  industry: string | null
  team_size: string | null
  logo_url: string | null
  cover_url: string | null
}

export interface BusinessPost {
  id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
}

export function useBusinessPage(userId: string | undefined) {
  const [biz, setBiz] = useState<BusinessProfile | null>(null)
  const [posts, setPosts] = useState<BusinessPost[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const [{ data: b }, { data: p }] = await Promise.all([
      supabase.from('business_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('business_posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ])
    setBiz((b as BusinessProfile) ?? null)
    setPosts((p as BusinessPost[]) ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const saveProfile = useCallback(async (patch: Partial<BusinessProfile>) => {
    if (!userId) return
    const { data } = await supabase
      .from('business_profiles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .maybeSingle()
    if (data) setBiz(data as BusinessProfile)
  }, [userId])

  const addPost = useCallback(async (content: string, imageUrl: string | null) => {
    if (!userId || !content.trim()) return
    const { data } = await supabase
      .from('business_posts')
      .insert({ user_id: userId, content: content.trim(), image_url: imageUrl })
      .select()
      .single()
    if (data) setPosts(prev => [data as BusinessPost, ...prev])
  }, [userId])

  const deletePost = useCallback(async (id: string) => {
    await supabase.from('business_posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
  }, [])

  async function uploadImage(file: File, folder: string): Promise<string | null> {
    if (!userId) return null
    const ext = file.name.split('.').pop()
    const path = `business/${userId}/${folder}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) return null
    return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
  }

  return { biz, posts, loading, saveProfile, addPost, deletePost, uploadImage, reload: load }
}
