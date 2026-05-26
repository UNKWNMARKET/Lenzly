import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const API = 'http://localhost:3001/api/admin'

interface AdminUser { username: string; token: string }
interface AdminAuthCtx {
  admin: AdminUser | null
  login: (username: string, password: string) => Promise<string | null>
  logout: () => void
  api: (path: string, opts?: RequestInit) => Promise<Response>
}

const Ctx = createContext<AdminAuthCtx>({} as AdminAuthCtx)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const raw = localStorage.getItem('lenzly_admin')
    return raw ? JSON.parse(raw) : null
  })

  async function login(username: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) return 'Invalid username or password'
      const data = await res.json()
      const user = { username: data.username, token: data.token }
      setAdmin(user)
      localStorage.setItem('lenzly_admin', JSON.stringify(user))
      return null
    } catch {
      return 'Cannot connect to admin server. Make sure it is running.'
    }
  }

  function logout() {
    setAdmin(null)
    localStorage.removeItem('lenzly_admin')
  }

  function api(path: string, opts: RequestInit = {}): Promise<Response> {
    return fetch(`${API}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin?.token ?? ''}`,
        ...(opts.headers ?? {}),
      },
    })
  }

  // Verify token on mount
  useEffect(() => {
    if (!admin) return
    api('/verify').then(r => { if (!r.ok) logout() }).catch(() => {})
  }, [])

  return <Ctx.Provider value={{ admin, login, logout, api }}>{children}</Ctx.Provider>
}

export const useAdminAuth = () => useContext(Ctx)
