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

// ── ADMIN CREDENTIALS ────────────────────────────────────────────────────────
// To change: set env vars ADMIN_USERNAME and ADMIN_PASSWORD_HASH
// Generate a new hash: node -e "const b=require('bcryptjs'); console.log(b.hashSync('yourpassword',10))"
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'eisdorferjesse1'
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

// ── Brand applications ────────────────────────────────────────────────────────
app.get('/api/admin/brands', requireAuth, (req, res) => {
  const db = readDB()
  res.json(db.brandApplications)
})

app.put('/api/admin/brands/:id/status', requireAuth, (req, res) => {
  const { status } = req.body // 'approved' | 'rejected' | 'pending'
  const db = readDB()
  const app_ = db.brandApplications.find(b => b.id === req.params.id)
  if (!app_) return res.status(404).json({ error: 'Not found' })
  app_.status = status
  app_.reviewedAt = new Date().toISOString()
  writeDB(db)
  res.json(app_)
})

app.delete('/api/admin/brands/:id', requireAuth, (req, res) => {
  const db = readDB()
  db.brandApplications = db.brandApplications.filter(b => b.id !== req.params.id)
  writeDB(db)
  res.json({ ok: true })
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

// ── Stats update (for live counters) ─────────────────────────────────────────
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
  console.log(`  Default login: admin / lenzly2024`)
  console.log(`  Change credentials via env vars ADMIN_USERNAME + ADMIN_PASSWORD_HASH\n`)
})
