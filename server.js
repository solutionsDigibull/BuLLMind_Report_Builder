// ─── BuLLMind API + OpenWork AI Proxy Server ─────────────────────────────────
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { createServer } from 'http'
import { mkdirSync } from 'fs'
import { execSync } from 'child_process'
import Anthropic from '@anthropic-ai/sdk'
import authRouter from './api/auth.js'
import uploadsRouter from './api/uploads.js'
import reportsRouter from './api/reports.js'
import archivesRouter from './api/archives.js'

mkdirSync('uploads', { recursive: true })

const app = express()
const PORT         = process.env.PORT ?? 3001
const ANTHROPIC_KEY = process.env.VITE_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? ''

app.use(helmet({
  crossOriginResourcePolicy: false,
  // Allow OpenWork (localhost:*) to embed BuLLMind in an iframe
  // frame-ancestors replaces X-Frame-Options for modern browsers
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      // Allow iframes from any localhost port (OpenWork uses dynamic ports)
      'frame-ancestors': ["'self'", 'http://localhost:*', 'http://127.0.0.1:*'],
    },
  },
  // Disable X-Frame-Options (it would override CSP frame-ancestors in older browsers)
  frameguard: false,
}))
app.use(cors({ origin: /^http:\/\/localhost:\d+$/, credentials: true }))
app.use(cookieParser())
app.use(express.json())

app.use('/api/auth',     authRouter)
app.use('/api/uploads',  uploadsRouter)
app.use('/api/reports',  reportsRouter)
app.use('/api/archives', archivesRouter)

// ── Schema metadata cache ─────────────────────────────────────────────────────
// Stores column info per upload so the chat endpoint builds prompts server-side.
// Key: `${userId}:${uploadId}`  Value: { columns, sampleValues, cachedAt }
const schemaCache = new Map()
const SCHEMA_TTL  = 60 * 60 * 1000 // 1 hour

export function warmSchemaCache(userId, uploadId, columns, sampleValues = {}) {
  schemaCache.set(`${userId}:${uploadId}`, { columns, sampleValues, cachedAt: Date.now() })
}

export function evictSchemaCache(userId, uploadId) {
  schemaCache.delete(`${userId}:${uploadId}`)
}

function getCachedSchema(userId, uploadId) {
  const entry = schemaCache.get(`${userId}:${uploadId}`)
  if (!entry) return null
  if (Date.now() - entry.cachedAt > SCHEMA_TTL) {
    schemaCache.delete(`${userId}:${uploadId}`)
    return null
  }
  return entry
}

function buildSystemPrompt(base, columns, sampleValues) {
  if (!columns?.length) return base
  const samples = Object.entries(sampleValues ?? {})
    .slice(0, 5)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')
  return `${base}\n\nAvailable data columns: ${columns.join(', ')}.${samples ? `\nSample values — ${samples}.` : ''}\nUse these exact column names in your JSON responses.`
}

// POST /api/schema-cache/:uploadId  — warm cache after file upload
app.post('/api/schema-cache/:uploadId', async (req, res) => {
  const { userId, columns, sampleValues } = req.body
  if (!userId || !columns) return res.status(400).json({ error: 'userId and columns required' })
  warmSchemaCache(userId, req.params.uploadId, columns, sampleValues)
  res.json({ ok: true, cached: columns.length })
})

// DELETE /api/schema-cache/:uploadId — evict on file delete
app.delete('/api/schema-cache/:uploadId', async (req, res) => {
  const { userId } = req.body
  if (userId) evictSchemaCache(userId, req.params.uploadId)
  res.json({ ok: true })
})

// ── Anthropic fallback ────────────────────────────────────────────────────────
function getAnthropicClient() {
  if (!ANTHROPIC_KEY) return null
  return new Anthropic({ apiKey: ANTHROPIC_KEY })
}

const ANTHROPIC_PROVIDERS = [
  { id: 'anthropic', models: [{ id: 'claude-sonnet-4-6' }, { id: 'claude-opus-4-6' }, { id: 'claude-haiku-4-5-20251001' }] },
]

// ── Runtime OpenWork detection ────────────────────────────────────────────────
let _conn = null
let _connAt = 0
const TTL = 30_000

function fetchT(url, opts = {}, ms = 900) {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), ms)
  return fetch(url, { ...opts, signal: ac.signal }).finally(() => clearTimeout(t))
}

/** Read the Bearer token from the OpenWork server process command line */
function readTokenFromProcess(pid) {
  try {
    const cmd = execSync(
      `powershell -Command "(Get-WmiObject Win32_Process -Filter 'ProcessId=${pid}').CommandLine"`,
      { timeout: 3000 }
    ).toString()
    const m = /--token\s+([a-f0-9-]{36})/.exec(cmd)
    return m?.[1] ?? null
  } catch { return null }
}

/** Get PID listening on a given port */
function getPidOnPort(port) {
  try {
    const out = execSync('netstat -ano', { timeout: 4000 }).toString()
    const re = new RegExp(`(?:0\\.0\\.0\\.0|127\\.0\\.0\\.1):${port}\\s+\\S+\\s+LISTENING\\s+(\\d+)`)
    const m = re.exec(out)
    return m ? parseInt(m[1]) : null
  } catch { return null }
}

async function detectOpenWork() {
  // Collect all high listening ports
  let ports = []
  try {
    const out = execSync('netstat -ano', { timeout: 5000 }).toString()
    const re = /(?:0\.0\.0\.0|127\.0\.0\.1):(\d{4,5})\s+\S+\s+LISTENING/g
    let m
    while ((m = re.exec(out)) !== null) {
      const p = parseInt(m[1])
      if (p > 1024 && p < 65000) ports.push(p)
    }
  } catch { return null }

  ports = [...new Set(ports)].sort((a, b) => a - b)

  let openworkServerPort = null
  let openworkToken = null

  // Pass 1 — find OpenWork server (health returns {"ok":true,"version":"0.X.Y"} — no opencode key)
  for (const port of ports) {
    try {
      const r = await fetchT(`http://127.0.0.1:${port}/health`, {}, 700)
      if (!r.ok) continue
      let data; try { data = await r.json() } catch { continue }
      if (data?.ok && data?.version && !data?.opencode) {
        // This is the OpenWork server — get its Bearer token from the process
        const pid = getPidOnPort(port)
        const token = pid ? readTokenFromProcess(pid) : null
        if (token) {
          openworkServerPort = port
          openworkToken = token
          break
        }
      }
    } catch { /* skip */ }
  }

  if (!openworkServerPort) return null

  const openworkUrl = `http://127.0.0.1:${openworkServerPort}`
  console.log(`  [auto-detect] OpenWork server :${openworkServerPort}  token=${openworkToken?.slice(0, 8)}…`)
  return { openworkUrl, openworkToken }
}

export async function getConnection() {
  const now = Date.now()
  if (_conn && now - _connAt < TTL) return _conn
  const detected = await detectOpenWork()
  if (detected) { _conn = detected; _connAt = now; return _conn }
  // env fallback
  return {
    openworkUrl:   process.env.OPENWORK_SERVER_URL ?? 'http://127.0.0.1:59934',
    openworkToken: process.env.OPENWORK_TOKEN      ?? '',
  }
}

// ── Proxy calls to OpenCode via the OpenWork server's /opencode/* path ────────
async function owFetch(path, options = {}) {
  const { openworkUrl, openworkToken } = await getConnection()
  const { headers = {}, ...rest } = options
  return fetch(`${openworkUrl}/opencode${path}`, {
    ...rest,
    headers: {
      'Authorization': `Bearer ${openworkToken}`,
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

// ── GET /api/openwork/health ──────────────────────────────────────────────────
app.get('/api/openwork/health', async (_req, res) => {
  _conn = null // bust cache on every health check

  try {
    const { openworkUrl, openworkToken } = await getConnection()
    if (openworkToken) {
      const r = await fetchT(`${openworkUrl}/health`, {}, 3000)
      if (r.ok) {
        const data = await r.json()
        return res.json({ ...data, via: 'openwork' })
      }
    }
  } catch { /* fall through */ }

  // Anthropic fallback
  if (getAnthropicClient()) {
    return res.json({ ok: true, via: 'anthropic', version: 'direct' })
  }

  res.status(502).json({ ok: false, error: 'OpenWork not running and no Anthropic API key.' })
})

// ── GET /api/openwork/providers ───────────────────────────────────────────────
app.get('/api/openwork/providers', async (_req, res) => {
  try {
    const r = await owFetch('/config/providers')
    if (r.ok) return res.json(await r.json())
  } catch { /* fall through */ }

  if (getAnthropicClient()) return res.json(ANTHROPIC_PROVIDERS)
  res.status(502).json({ error: 'Cannot fetch providers' })
})

// ── GET /api/openwork/tools ───────────────────────────────────────────────────
app.get('/api/openwork/tools', async (req, res) => {
  // Tools are not critical — always return empty on error
  try {
    const { provider, model } = req.query
    if (!provider || !model) return res.json([])
    const r = await owFetch(`/tool?provider=${encodeURIComponent(provider)}&model=${encodeURIComponent(model)}`)
    if (r.ok) {
      const data = await r.json()
      const tools = Array.isArray(data)
        ? data.map(t => ({ name: t.name ?? t.id ?? String(t), description: t.description ?? '' }))
        : Object.entries(data ?? {}).map(([name, v]) => ({ name, description: v?.description ?? '' }))
      return res.json(tools)
    }
  } catch { /* ignore */ }
  res.json([])
})

// ── POST /api/openwork/chat ───────────────────────────────────────────────────
app.post('/api/openwork/chat', async (req, res) => {
  const { providerID, modelID, systemPrompt, userText, enabledTools = [], uploadId, userId } = req.body
  res.setHeader('Content-Type', 'application/x-ndjson')
  res.setHeader('Transfer-Encoding', 'chunked')

  // Build system prompt: use cached schema if available, else use client-provided prompt
  const cached = (uploadId && userId) ? getCachedSchema(userId, uploadId) : null
  const finalSystemPrompt = cached
    ? buildSystemPrompt(systemPrompt, cached.columns, cached.sampleValues)
    : systemPrompt

  // ── Path 1: OpenWork server → OpenCode proxy ────────────────────────────────
  try {
    const sessionRes = await owFetch('/session', { method: 'POST', body: JSON.stringify({}) })
    if (!sessionRes.ok) throw new Error(`session create failed: ${sessionRes.status}`)
    const session = await sessionRes.json()
    const sessionID = session?.id
    if (!sessionID) throw new Error('No session ID')

    const msgRes = await owFetch(`/session/${sessionID}/message`, {
      method: 'POST',
      body: JSON.stringify({
        providerID,
        modelID,
        system: finalSystemPrompt,
        parts: [{ type: 'text', text: userText }],
      }),
    })
    if (!msgRes.ok) throw new Error(`message failed: ${msgRes.status}`)

    const msg = await msgRes.json()
    const text = (msg?.parts ?? []).filter(p => p.type === 'text').map(p => p.text).join('')

    for (const word of text.split(' ')) {
      res.write(JSON.stringify({ token: word + ' ' }) + '\n')
      await new Promise(r => setTimeout(r, 12))
    }
    return res.end()
  } catch (err) {
    console.warn('[chat] OpenWork path failed:', err?.message)
  }

  // ── Path 2: Anthropic SDK (permanent fallback) ──────────────────────────────
  const anthropic = getAnthropicClient()
  if (anthropic) {
    try {
      const resolvedModel = /claude/i.test(modelID) ? modelID : 'claude-haiku-4-5-20251001'
      const stream = anthropic.messages.stream({
        model: resolvedModel,
        max_tokens: 2048,
        system: finalSystemPrompt,
        messages: [{ role: 'user', content: userText }],
      })
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          res.write(JSON.stringify({ token: event.delta.text }) + '\n')
        }
      }
      return res.end()
    } catch (err) {
      res.write(JSON.stringify({ error: `Anthropic error: ${err?.message}` }) + '\n')
      return res.end()
    }
  }

  res.write(JSON.stringify({ error: 'No AI backend available. Start OpenWork or add ANTHROPIC_API_KEY to .env.' }) + '\n')
  res.end()
})

const httpServer = createServer(app)

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`\n  Port ${PORT} in use — killing it and retrying…`)
    try {
      execSync(`npx kill-port ${PORT}`, { timeout: 4000 })
    } catch { /* ignore */ }
    setTimeout(() => httpServer.listen(PORT), 1500)
  } else {
    console.error('Server error:', err)
  }
})

httpServer.listen(PORT, async () => {
  const conn = await getConnection()
  console.log(`\n  BuLLMind proxy  →  http://localhost:${PORT}`)
  if (_conn) {
    console.log(`  OpenWork server →  ${conn.openworkUrl}`)
    console.log(`  OpenWork token  →  ${conn.openworkToken?.slice(0, 8)}…  (auto-detected ✓)`)
  } else {
    console.log(`  OpenWork        →  not detected`)
  }
  console.log(`  Anthropic key   →  ${ANTHROPIC_KEY ? 'present ✓ (fallback ready)' : 'missing'}\n`)
})
