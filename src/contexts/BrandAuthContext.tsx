import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const API = 'http://localhost:3001/api/brand'

interface BrandUser { id: string; company: string; email: string; token: string }
interface BrandAuthCtx {
  brand: BrandUser | null
  login: (email: string, password: string) => Promise<string | null>
  logout: () => void
  brandApi: (path: string, opts?: RequestInit) => Promise<Response>
}

const Ctx = createContext<BrandAuthCtx>({} as BrandAuthCtx)

export function BrandAuthProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandUser | null>(() => {
    const raw = localStorage.getItem('lenzly_brand')
    return raw ? JSON.parse(raw) : null
  })

  async function login(email: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        return data.error || 'Invalid email or password'
      }
      const data = await res.json()
      const user = { id: data.id, company: data.company, email: data.email, token: data.token }
      setBrand(user)
      localStorage.setItem('lenzly_brand', JSON.stringify(user))
      return null
    } catch {
      return 'Cannot connect to server. Please try again.'
    }
  }

  function logout() {
    setBrand(null)
    localStorage.removeItem('lenzly_brand')
  }

  function brandApi(path: string, opts: RequestInit = {}): Promise<Response> {
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
    brandApi('/verify').then(r => { if (!r.ok) logout() }).catch(() => {})
  }, [])

  return <Ctx.Provider value={{ brand, login, logout, brandApi }}>{children}</Ctx.Provider>
}

export const useBrandAuth = () => useContext(Ctx)
