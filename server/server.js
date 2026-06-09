'use strict'
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'lenzly-admin-secret-change-in-production'
const DB_PATH = path.join(__dirname, 'db.json')

// ── Supabase (for photographer search) ───────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zdmtiyyfljzwveaowjxq.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1QS2OxeITYGN0E8d1QNeQw_DHRuVByw'

async function supabaseFetch(path, params = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) return []
  return res.json()
}

// ── ADMIN CREDENTIALS ────────────────────────────────────────────────────────
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'eisdorferjesse1'
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH ||
  '$2a$10$PzBOLx78maOS51uisBtIhO6.MkxR6AS1oWTVdAx8EoJNz0A5QHuiS'

app.use(cors({
  origin: [
    'http://localhost:5173', 'http://127.0.0.1:5173',
    'http://localhost:5174', 'http://127.0.0.1:5174',
  ],
  credentials: true,
}))
app.use(express.json())

// ── DB helpers ────────────────────────────────────────────────────────────────
function readDB() {
  const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
  if (!raw.brandUsers) raw.brandUsers = []
  if (!raw.hireRequests) raw.hireRequests = []
  return raw
}
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8')
}

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.admin = jwt.verify(auth.slice(7), JWT_SECRET)
    if (req.admin.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

function requireBrandAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.brand = jwt.verify(auth.slice(7), JWT_SECRET)
    if (req.brand.role !== 'brand') return res.status(403).json({ error: 'Forbidden' })
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// ── Admin Auth ────────────────────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body
  if (username !== ADMIN_USERNAME || !bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' })
  res.json({ token, username })
})

app.get('/api/admin/verify', requireAuth, (req, res) => {
  res.json({ ok: true, username: req.admin.username })
})

// ── Dashboard stats ───────────────────────────────────────────────────────────
app.get('/api/admin/stats', requireAuth, (req, res) => {
  const db = readDB()
  res.json(db.stats)
})

app.put('/api/admin/stats', requireAuth, (req, res) => {
  const db = readDB()
  db.stats = { ...db.stats, ...req.body }
  writeDB(db)
  res.json(db.stats)
})

// ── Settings ──────────────────────────────────────────────────────────────────
app.get('/api/admin/settings', requireAuth, (req, res) => {
  const db = readDB()
  res.json(db.settings)
})

app.put('/api/admin/settings', requireAuth, (req, res) => {
  const db = readDB()
  db.settings = { ...db.settings, ...req.body }
  writeDB(db)
  res.json(db.settings)
})

// ── Brand applications (admin) ────────────────────────────────────────────────
app.get('/api/admin/brands', requireAuth, (req, res) => {
  const db = readDB()
  res.json(db.brandApplications)
})

app.put('/api/admin/brands/:id/status', requireAuth, (req, res) => {
  const { status } = req.body
  const db = readDB()
  const app_ = db.brandApplications.find(b => b.id === req.params.id)
  if (!app_) return res.status(404).json({ error: 'Not found' })
  app_.status = status
  app_.reviewedAt = new Date().toISOString()

  // When approving: create brand user account if not already created
  if (status === 'approved') {
    const existing = db.brandUsers.find(u => u.applicationId === app_.id)
    if (!existing) {
      // Generate a temporary password they'll need to reset
      const tempPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase()
      const passwordHash = bcrypt.hashSync(tempPassword, 10)
      const brandUser = {
        id: `bu_${Date.now()}`,
        applicationId: app_.id,
        company: app_.company,
        email: app_.email,
        passwordHash,
        tempPassword, // returned once so admin can share with brand
        shortlist: [],
        createdAt: new Date().toISOString(),
      }
      db.brandUsers.push(brandUser)
      app_.brandUserId = brandUser.id
      app_.tempPassword = tempPassword
      writeDB(db)
      return res.json({ ...app_, tempPassword })
    }
  }

  writeDB(db)
  res.json(app_)
})

app.delete('/api/admin/brands/:id', requireAuth, (req, res) => {
  const db = readDB()
  db.brandApplications = db.brandApplications.filter(b => b.id !== req.params.id)
  writeDB(db)
  res.json({ ok: true })
})

// ── Admin: view all hire requests ─────────────────────────────────────────────
app.get('/api/admin/hire-requests', requireAuth, (req, res) => {
  const db = readDB()
  res.json(db.hireRequests ?? [])
})

// ── Brand application (public) ────────────────────────────────────────────────
app.post('/api/brand/apply', (req, res) => {
  const { company, email, website, needs } = req.body
  if (!company || !email) return res.status(400).json({ error: 'Company and email are required' })
  const db = readDB()
  // Prevent duplicate applications from same email
  if (db.brandApplications.some(b => b.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'An application with this email already exists' })
  }
  const application = {
    id: `ba_${Date.now()}`,
    company: company.trim(),
    email: email.trim().toLowerCase(),
    website: (website ?? '').trim(),
    needs: Array.isArray(needs) ? needs : [],
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  db.brandApplications.unshift(application)
  writeDB(db)
  res.json({ ok: true, id: application.id })
})

// ── Brand auth ────────────────────────────────────────────────────────────────
app.post('/api/brand/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
  const db = readDB()
  const user = db.brandUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  const app_ = db.brandApplications.find(a => a.id === user.applicationId)
  if (!app_ || app_.status !== 'approved') {
    return res.status(403).json({ error: 'Your account is not yet approved' })
  }
  const token = jwt.sign({ brandId: user.id, email: user.email, company: user.company, role: 'brand' }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, company: user.company, email: user.email })
})

app.get('/api/brand/verify', requireBrandAuth, (req, res) => {
  res.json({ ok: true, company: req.brand.company, email: req.brand.email })
})

app.post('/api/brand/change-password', requireBrandAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
  const db = readDB()
  const user = db.brandUsers.find(u => u.id === req.brand.brandId)
  if (!user || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }
  user.passwordHash = bcrypt.hashSync(newPassword, 10)
  delete user.tempPassword
  writeDB(db)
  res.json({ ok: true })
})

// ── Brand: photographer search ────────────────────────────────────────────────
app.get('/api/brand/photographers', requireBrandAuth, async (req, res) => {
  try {
    const { specialty, location, available, search, page = '0' } = req.query
    const limit = 20
    const offset = parseInt(page) * limit

    let query = 'profiles?is_pro=eq.true&select=id,username,name,avatar_url,bio,specialty,location,price_range,available,followers_count,posts_count'
    query += `&limit=${limit}&offset=${offset}&order=followers_count.desc`

    if (available === 'true') query += '&available=eq.true'

    let profiles = await supabaseFetch(query.replace('profiles?', 'profiles?'), {})

    // Filter client-side for specialty and search (Supabase array contains is complex via REST)
    if (specialty) {
      profiles = profiles.filter(p => p.specialty?.some(s => s.toLowerCase().includes(specialty.toLowerCase())))
    }
    if (location) {
      profiles = profiles.filter(p => p.location?.toLowerCase().includes(location.toLowerCase()))
    }
    if (search) {
      const q = search.toLowerCase()
      profiles = profiles.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.username?.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) ||
        p.specialty?.some(s => s.toLowerCase().includes(q))
      )
    }

    res.json(profiles)
  } catch (err) {
    console.error('Photographer search error:', err)
    res.status(500).json({ error: 'Failed to fetch photographers' })
  }
})

// Get a single photographer's posts for portfolio view
app.get('/api/brand/photographers/:id/posts', requireBrandAuth, async (req, res) => {
  try {
    const posts = await supabaseFetch(`posts?user_id=eq.${req.params.id}&select=id,image_url,caption,likes_count,category&order=created_at.desc&limit=12`)
    res.json(posts)
  } catch {
    res.status(500).json({ error: 'Failed to fetch posts' })
  }
})

// ── Brand: shortlist ──────────────────────────────────────────────────────────
app.get('/api/brand/shortlist', requireBrandAuth, async (req, res) => {
  const db = readDB()
  const user = db.brandUsers.find(u => u.id === req.brand.brandId)
  if (!user) return res.status(404).json({ error: 'Not found' })
  if (!user.shortlist?.length) return res.json([])
  try {
    const ids = user.shortlist.join(',')
    const profiles = await supabaseFetch(`profiles?id=in.(${ids})&select=id,username,name,avatar_url,specialty,location,available,price_range`)
    res.json(profiles)
  } catch {
    res.status(500).json({ error: 'Failed to fetch shortlist' })
  }
})

app.post('/api/brand/shortlist/:photographerId', requireBrandAuth, (req, res) => {
  const db = readDB()
  const user = db.brandUsers.find(u => u.id === req.brand.brandId)
  if (!user) return res.status(404).json({ error: 'Not found' })
  if (!user.shortlist) user.shortlist = []
  const id = req.params.photographerId
  if (!user.shortlist.includes(id)) user.shortlist.push(id)
  writeDB(db)
  res.json({ ok: true, shortlist: user.shortlist })
})

app.delete('/api/brand/shortlist/:photographerId', requireBrandAuth, (req, res) => {
  const db = readDB()
  const user = db.brandUsers.find(u => u.id === req.brand.brandId)
  if (!user) return res.status(404).json({ error: 'Not found' })
  user.shortlist = (user.shortlist ?? []).filter(id => id !== req.params.photographerId)
  writeDB(db)
  res.json({ ok: true, shortlist: user.shortlist })
})

// ── Brand: hire requests ──────────────────────────────────────────────────────
app.get('/api/brand/hire-requests', requireBrandAuth, async (req, res) => {
  const db = readDB()
  const requests = (db.hireRequests ?? []).filter(r => r.brandId === req.brand.brandId)
  // Enrich with photographer names
  try {
    const ids = [...new Set(requests.map(r => r.photographerId))]
    if (ids.length) {
      const profiles = await supabaseFetch(`profiles?id=in.(${ids.join(',')})&select=id,name,username,avatar_url`)
      const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))
      return res.json(requests.map(r => ({ ...r, photographer: profileMap[r.photographerId] ?? null })))
    }
  } catch {}
  res.json(requests)
})

app.post('/api/brand/hire-requests', requireBrandAuth, (req, res) => {
  const { photographerId, message, budget, projectType, startDate } = req.body
  if (!photographerId || !message) return res.status(400).json({ error: 'Photographer and message are required' })
  const db = readDB()
  // Prevent duplicate pending requests to same photographer
  const existing = (db.hireRequests ?? []).find(
    r => r.brandId === req.brand.brandId && r.photographerId === photographerId && r.status === 'pending'
  )
  if (existing) return res.status(409).json({ error: 'You already have a pending request to this photographer' })
  if (!db.hireRequests) db.hireRequests = []
  const request = {
    id: `hr_${Date.now()}`,
    brandId: req.brand.brandId,
    brandName: req.brand.company,
    brandEmail: req.brand.email,
    photographerId,
    message: message.trim().slice(0, 1000),
    budget: budget ?? null,
    projectType: projectType ?? null,
    startDate: startDate ?? null,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  db.hireRequests.push(request)
  writeDB(db)
  res.json(request)
})

app.put('/api/brand/hire-requests/:id/cancel', requireBrandAuth, (req, res) => {
  const db = readDB()
  const request = (db.hireRequests ?? []).find(r => r.id === req.params.id && r.brandId === req.brand.brandId)
  if (!request) return res.status(404).json({ error: 'Not found' })
  if (request.status !== 'pending') return res.status(400).json({ error: 'Can only cancel pending requests' })
  request.status = 'cancelled'
  writeDB(db)
  res.json(request)
})

// ── Announcements ─────────────────────────────────────────────────────────────
app.get('/api/admin/announcements', requireAuth, (req, res) => {
  const db = readDB()
  res.json(db.announcements)
})

app.post('/api/admin/announcements', requireAuth, (req, res) => {
  const db = readDB()
  const item = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() }
  db.announcements.unshift(item)
  writeDB(db)
  res.json(item)
})

app.delete('/api/admin/announcements/:id', requireAuth, (req, res) => {
  const db = readDB()
  db.announcements = db.announcements.filter(a => a.id !== req.params.id)
  writeDB(db)
  res.json({ ok: true })
})

// ── Flagged content ───────────────────────────────────────────────────────────
app.get('/api/admin/flagged', requireAuth, (req, res) => {
  const db = readDB()
  res.json(db.flaggedContent)
})

app.post('/api/admin/flagged', requireAuth, (req, res) => {
  const db = readDB()
  const item = { id: Date.now().toString(), ...req.body, flaggedAt: new Date().toISOString() }
  db.flaggedContent.push(item)
  writeDB(db)
  res.json(item)
})

app.delete('/api/admin/flagged/:id', requireAuth, (req, res) => {
  const db = readDB()
  db.flaggedContent = db.flaggedContent.filter(f => f.id !== req.params.id)
  writeDB(db)
  res.json({ ok: true })
})

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true, version: '2.0.0' }))

app.listen(PORT, () => {
  console.log(`\n  LENZLY Admin + Brand API running on http://localhost:${PORT}`)
  console.log(`  Admin login: ${ADMIN_USERNAME}`)
  console.log(`  Brand portal: /brand-portal\n`)
})
