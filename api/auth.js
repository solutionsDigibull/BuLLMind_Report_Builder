import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { requireAuth } from '../middleware/auth.js'
import prisma from '../lib/prisma.js'

const router = Router()

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role ?? 'editor' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
  )
}

function setAuthCookie(res, token) {
  res.cookie('bullmind_token', token, COOKIE_OPTS)
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, name, password } = req.body
  if (!email || !name || !password)
    return res.status(400).json({ error: 'email, name and password are required' })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ error: 'Email already in use' })

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, name, password: hashed } })
  const token = signToken(user)
  setAuthCookie(res, token)
  res.json({ user: { id: user.id, email: user.email, name: user.name, theme: user.theme } })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const match = await bcrypt.compare(password, user.password)
  if (!match) return res.status(401).json({ error: 'Invalid credentials' })

  const token = signToken(user)
  setAuthCookie(res, token)
  res.json({ user: { id: user.id, email: user.email, name: user.name, theme: user.theme } })
})

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('bullmind_token', { ...COOKIE_OPTS, maxAge: 0 })
  res.json({ ok: true })
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ id: user.id, email: user.email, name: user.name, theme: user.theme })
})

// POST /api/auth/sso  — validate OpenWork session_id and set HttpOnly cookie
// Payload: { session_id }  — no password, no URL params, sets HttpOnly cookie on success
router.post('/sso', async (req, res) => {
  const { session_id } = req.body
  if (!session_id) return res.status(400).json({ error: 'session_id required' })

  try {
    // getConnection() is async — must be awaited
    const { getConnection } = await import('../server.js')
    const { openworkUrl, openworkToken } = await getConnection()

    if (!openworkToken) return res.status(503).json({ error: 'OpenWork not reachable' })

    // Validate session_id via OpenWork proxy (no direct OpenCode auth needed)
    const r = await fetch(`${openworkUrl}/opencode/session/${session_id}`, {
      headers: { Authorization: `Bearer ${openworkToken}` },
    })

    if (!r.ok) return res.status(401).json({ error: 'Invalid or expired session_id' })

    const sessionInfo = await r.json()

    // Map OpenWork session → BuLLMind user (auto-provision on first SSO login)
    const owEmail = sessionInfo?.email ?? `sso-${session_id.slice(0, 8)}@openwork.local`
    const owName  = sessionInfo?.title ?? 'OpenWork User'
    // Map OpenWork roles to BuLLMind roles: owner/admin → admin, else editor
    const rawRole = sessionInfo?.role ?? sessionInfo?.access ?? 'editor'
    const owRole  = ['owner', 'admin'].includes(rawRole) ? 'admin' : rawRole === 'viewer' ? 'viewer' : 'editor'

    let user = await prisma.user.findUnique({ where: { email: owEmail } })
    if (!user) {
      user = await prisma.user.create({
        data: { email: owEmail, name: owName, password: '', role: owRole },
      })
    } else {
      // Update role on every SSO login in case it changed in OpenWork
      user = await prisma.user.update({ where: { id: user.id }, data: { role: owRole } })
    }

    const token = signToken(user)
    setAuthCookie(res, token)   // HttpOnly cookie — no token in response body or URL
    res.json({ user: { id: user.id, email: user.email, name: user.name, theme: user.theme } })
  } catch (err) {
    console.error('SSO error:', err)
    res.status(500).json({ error: 'SSO validation failed' })
  }
})

// PUT /api/auth/theme
router.put('/theme', requireAuth, async (req, res) => {
  const { theme } = req.body
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { theme } })
  res.json({ theme: user.theme })
})

export default router
