import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const API = 'http://localhost:3001/api/admin'
const SESSION_TTL_MS = 60 * 60 * 1000 // 1 hour

interface AdminUser { username: string; token: string; expiresAt: number }
interface AdminAuthCtx {
  admin: AdminUser | null
  login: (username: string, password: string) => Promise<string | null>
  logout: () => void
  api: (path: string, opts?: RequestInit) => Promise<Response>
}

const Ctx = createContext<AdminAuthCtx>({} as AdminAuthCtx)

function loadAdmin(): AdminUser | null {
  try {
    const raw = localStorage.getItem('lenzly_admin')
    if (!raw) return null
    const parsed = JSON.parse(raw) as AdminUser
    if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem('lenzly_admin')
      return null
    }
    return parsed
  } catch {
    localStorage.removeItem('lenzly_admin')
    return null
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(loadAdmin)

  async function login(username: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) return 'Invalid username or password'
      const data = await res.json()
      const user: AdminUser = { username: data.username, token: data.token, expiresAt: Date.now() + SESSION_TTL_MS }
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
    // Check session expiry before every request
    if (admin && Date.now() > admin.expiresAt) {
      logout()
      return Promise.reject(new Error('Session expired'))
    }
    return fetch(`${API}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin?.token ?? ''}`,
        ...(opts.headers ?? {}),
      },
    })
  }

  // Verify token on mount and expire stale sessions
  useEffect(() => {
    if (!admin) return
    if (Date.now() > admin.expiresAt) { logout(); return }
    api('/verify').then(r => { if (!r.ok) logout() }).catch(() => {})
  }, [])

  return <Ctx.Provider value={{ admin, login, logout, api }}>{children}</Ctx.Provider>
}

export const useAdminAuth = () => useContext(Ctx)
