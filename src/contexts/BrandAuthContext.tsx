import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const API = 'http://localhost:3001/api/brand'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface BrandUser { company: string; email: string; token: string; expiresAt: number }
interface BrandAuthCtx {
  brand: BrandUser | null
  login: (email: string, password: string) => Promise<string | null>
  logout: () => void
  api: (path: string, opts?: RequestInit) => Promise<Response>
  brandApi: (path: string, opts?: RequestInit) => Promise<Response>
}

const Ctx = createContext<BrandAuthCtx>({} as BrandAuthCtx)

function loadBrand(): BrandUser | null {
  try {
    const raw = localStorage.getItem('lenzly_brand')
    if (!raw) return null
    const parsed = JSON.parse(raw) as BrandUser
    if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem('lenzly_brand')
      return null
    }
    return parsed
  } catch {
    localStorage.removeItem('lenzly_brand')
    return null
  }
}

export function BrandAuthProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandUser | null>(loadBrand)

  async function login(email: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return data.error ?? 'Invalid email or password'
      }
      const data = await res.json()
      const user: BrandUser = { company: data.company, email: data.email, token: data.token, expiresAt: Date.now() + SESSION_TTL_MS }
      setBrand(user)
      localStorage.setItem('lenzly_brand', JSON.stringify(user))
      return null
    } catch {
      return 'Cannot connect to server. Make sure the admin server is running.'
    }
  }

  function logout() {
    setBrand(null)
    localStorage.removeItem('lenzly_brand')
  }

  function api(path: string, opts: RequestInit = {}): Promise<Response> {
    if (brand && Date.now() > brand.expiresAt) { logout(); return Promise.reject(new Error('Session expired')) }
    return fetch(`${API}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brand?.token ?? ''}`,
        ...(opts.headers ?? {}),
      },
    })
  }

  useEffect(() => {
    if (!brand) return
    if (Date.now() > brand.expiresAt) { logout(); return }
    api('/verify').then(r => { if (!r.ok) logout() }).catch(() => {})
  }, [])

  return <Ctx.Provider value={{ brand, login, logout, api, brandApi: api }}>{children}</Ctx.Provider>
}

export const useBrandAuth = () => useContext(Ctx)
