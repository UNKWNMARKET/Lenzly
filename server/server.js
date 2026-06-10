'use strict'
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'lenzly-admin-secret-change-in-production'
const BRAND_JWT_SECRET = process.env.BRAND_JWT_SECRET || 'lenzly-brand-secret-change-in-production'
const DB_PATH = path.join(__dirname, 'db.json')

// ── ADMIN CREDENTIALS ────────────────────────────────────────────────────────
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'eisdorferjesse@gmail.com'
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH ||
  '$2a$10$PzBOLx78maOS51uisBtIhO6.MkxR6AS1oWTVdAx8EoJNz0A5QHuiS'

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())

// ── DB helpers ────────────────────────────────────────────────────────────────
function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8')
}

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    req.admin = jwt.verify(auth.slice(7), JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

function requireBrandAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    req.brand = jwt.verify(auth.slice(7), BRAND_JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// ── Auth routes ───────────────────────────────────────────────────────────────
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

// ── Brand applications (public submit) ────────────────────────────────────────
app.post('/api/brands/apply', (req, res) => {
  const { company, email, website, needs } = req.body
  if (!company || !email) return res.status(400).json({ error: 'Company and email are required' })

  const db = readDB()

  // Check for duplicate email
  const exists = db.brandApplications.find(b => b.email.toLowerCase() === email.toLowerCase())
  if (exists) return res.status(409).json({ error: 'An application with this email already exists' })

  const application = {
    id: `ba${Date.now()}`,
    company: company.trim(),
    email: email.trim().toLowerCase(),
    website: website ? website.trim().replace(/^https?:\/\//, '') : '',
    needs: needs || [],
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  db.brandApplications.push(application)
  db.stats.totalBrands = (db.stats.totalBrands || 0) + 1
  writeDB(db)
  res.status(201).json({ ok: true, id: application.id })
})

// ── Brand applications (admin) ────────────────────────────────────────────────
app.get('/api/admin/brands', requireAuth, (req, res) => {
  const db = readDB()
  res.json(db.brandApplications)
})

app.put('/api/admin/brands/:id/status', requireAuth, (req, res) => {
  const { status } = req.body // 'approved' | 'rejected' | 'pending'
  const db = readDB()
  const application = db.brandApplications.find(b => b.id === req.params.id)
  if (!application) return res.status(404).json({ error: 'Not found' })

  application.status = status
  application.reviewedAt = new Date().toISOString()

  let tempPassword = null

  if (status === 'approved') {
    // Create brand account if not already exists
    if (!db.brandAccounts) db.brandAccounts = []
    const existingAccount = db.brandAccounts.find(a => a.email === application.email)
    if (!existingAccount) {
      tempPassword = crypto.randomBytes(5).toString('hex').toUpperCase() + '!'
      const passwordHash = bcrypt.hashSync(tempPassword, 10)
      db.brandAccounts.push({
        id: application.id,
        company: application.company,
        email: application.email,
        website: application.website,
        needs: application.needs,
        passwordHash,
        tempPassword, // stored so admin can retrieve it
        createdAt: new Date().toISOString(),
      })
    } else {
      tempPassword = existingAccount.tempPassword || null
    }
  }

  writeDB(db)
  res.json({ ...application, tempPassword })
})

app.delete('/api/admin/brands/:id', requireAuth, (req, res) => {
  const db = readDB()
  db.brandApplications = db.brandApplications.filter(b => b.id !== req.params.id)
  if (db.brandAccounts) {
    db.brandAccounts = db.brandAccounts.filter(a => a.id !== req.params.id)
  }
  writeDB(db)
  res.json({ ok: true })
})

// ── Brand auth ────────────────────────────────────────────────────────────────
app.post('/api/brand/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  const db = readDB()
  if (!db.brandAccounts) return res.status(401).json({ error: 'Invalid credentials' })

  const account = db.brandAccounts.find(a => a.email === email.toLowerCase().trim())
  if (!account || !bcrypt.compareSync(password, account.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = jwt.sign(
    { id: account.id, email: account.email, company: account.company, role: 'brand' },
    BRAND_JWT_SECRET,
    { expiresIn: '7d' }
  )
  res.json({ token, company: account.company, email: account.email, id: account.id })
})

app.get('/api/brand/verify', requireBrandAuth, (req, res) => {
  res.json({ ok: true, ...req.brand })
})

app.get('/api/brand/profile', requireBrandAuth, (req, res) => {
  const db = readDB()
  if (!db.brandAccounts) return res.status(404).json({ error: 'Not found' })
  const account = db.brandAccounts.find(a => a.id === req.brand.id)
  if (!account) return res.status(404).json({ error: 'Not found' })
  const { passwordHash, tempPassword, ...safe } = account
  res.json(safe)
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

// ── Stats update ──────────────────────────────────────────────────────────────
app.put('/api/admin/stats', requireAuth, (req, res) => {
  const db = readDB()
  db.stats = { ...db.stats, ...req.body }
  writeDB(db)
  res.json(db.stats)
})

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true, version: '1.0.0' }))

app.listen(PORT, () => {
  console.log(`\n  LENZLY Admin API running on http://localhost:${PORT}`)
  console.log(`  Admin login: eisdorferjesse@gmail.com / lenzly2024`)
  console.log(`  Brand login: /brand/login (email + temp password from approval)\n`)
})
