import { useState, useEffect, useCallback } from 'react'

const SHORTLIST_KEY = 'lenzly_biz_shortlist'
const REQUESTS_KEY = 'lenzly_biz_requests'

export interface HireRequest {
  id: string
  photographerId: string
  photographerName: string
  photographerAvatar: string | null
  projectType: string
  budget: string
  date: string
  message: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  createdAt: number
}

function read<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}

export function useShortlist() {
  const [ids, setIds] = useState<string[]>(() => read(SHORTLIST_KEY, []))
  useEffect(() => { localStorage.setItem(SHORTLIST_KEY, JSON.stringify(ids)) }, [ids])
  const toggle = useCallback((id: string) => setIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), [])
  const has = useCallback((id: string) => ids.includes(id), [ids])
  return { ids, toggle, has }
}

export function useHireRequests() {
  const [requests, setRequests] = useState<HireRequest[]>(() => read(REQUESTS_KEY, []))
  useEffect(() => { localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests)) }, [requests])
  const add = useCallback((r: Omit<HireRequest, 'id' | 'status' | 'createdAt'>) => {
    setRequests(p => [{ ...r, id: crypto.randomUUID(), status: 'pending', createdAt: Date.now() }, ...p])
  }, [])
  const cancel = useCallback((id: string) => setRequests(p => p.map(r => r.id === id ? { ...r, status: 'cancelled' as const } : r)), [])
  return { requests, add, cancel }
}
