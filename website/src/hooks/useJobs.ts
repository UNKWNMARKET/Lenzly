import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface Job {
  id: string
  user_id: string
  title: string
  description: string | null
  project_type: string | null
  location: string | null
  is_remote: boolean
  budget: string | null
  shoot_date: string | null
  status: 'open' | 'closed'
  created_at: string
}

export type JobDraft = Omit<Job, 'id' | 'user_id' | 'status' | 'created_at'>

// A brand's own job posts (all statuses)
export function useMyJobs(userId: string | undefined) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('photography_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setJobs((data as Job[]) ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (draft: JobDraft) => {
    if (!userId) return
    const { data } = await supabase
      .from('photography_jobs')
      .insert({ ...draft, user_id: userId })
      .select()
      .single()
    if (data) setJobs(prev => [data as Job, ...prev])
  }, [userId])

  const update = useCallback(async (id: string, patch: Partial<Job>) => {
    const { data } = await supabase
      .from('photography_jobs')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (data) setJobs(prev => prev.map(j => j.id === id ? (data as Job) : j))
  }, [])

  const remove = useCallback(async (id: string) => {
    await supabase.from('photography_jobs').delete().eq('id', id)
    setJobs(prev => prev.filter(j => j.id !== id))
  }, [])

  const toggleStatus = useCallback(async (job: Job) => {
    await update(job.id, { status: job.status === 'open' ? 'closed' : 'open' })
  }, [update])

  // Master switch: open or close every job at once
  const setAll = useCallback(async (status: 'open' | 'closed') => {
    if (!userId) return
    await supabase
      .from('photography_jobs')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
    setJobs(prev => prev.map(j => ({ ...j, status })))
  }, [userId])

  return { jobs, loading, create, update, remove, toggleStatus, setAll, reload: load }
}
