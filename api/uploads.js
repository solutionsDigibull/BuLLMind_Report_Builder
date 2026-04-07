import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { requireAuth, requireRole } from '../middleware/auth.js'
import Papa from 'papaparse'
import XLSX from 'xlsx'
import prisma from '../lib/prisma.js'

const router = Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } })

function parseFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase()
  if (ext === '.csv') {
    const content = fs.readFileSync(filePath, 'utf8')
    const result = Papa.parse(content, { header: true, skipEmptyLines: true })
    return { headers: result.meta.fields ?? [], rows: result.data }
  }
  if (['.xlsx', '.xls'].includes(ext)) {
    const workbook = XLSX.readFile(filePath)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    const headers = data[0]?.map(String) ?? []
    const rows = data.slice(1).map((row) => {
      const obj = {}
      headers.forEach((h, i) => { obj[h] = row[i] ?? '' })
      return obj
    })
    return { headers, rows }
  }
  return { headers: [], rows: [] }
}

// GET /api/uploads
router.get('/', requireAuth, async (req, res) => {
  const uploads = await prisma.upload.findMany({
    where: { userId: req.user.id },
    include: { mappings: true },
    orderBy: { uploadedAt: 'desc' },
  })
  res.json(uploads)
})

// POST /api/uploads  — editors and admins only
router.post('/', requireAuth, requireRole('admin', 'editor'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  try {
    const { headers, rows } = parseFile(req.file.path, req.file.originalname)
    const record = await prisma.upload.create({
      data: {
        userId: req.user.id,
        name: req.file.originalname,
        size: req.file.size,
        status: 'READY',
        filePath: req.file.path,
        headers,
      },
    })
    // Store parsed rows as a JSON sidecar file
    fs.writeFileSync(`${req.file.path}.rows.json`, JSON.stringify(rows))

    // Warm schema cache — build sample values from first row
    const sampleValues = rows[0] ? Object.fromEntries(
      Object.entries(rows[0]).slice(0, 8).map(([k, v]) => [k, String(v).slice(0, 50)])
    ) : {}
    const { warmSchemaCache } = await import('../server.js')
    warmSchemaCache(req.user.id, record.id, headers, sampleValues)

    res.json(record)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to process file' })
  }
})

// GET /api/uploads/:id/rows
router.get('/:id/rows', requireAuth, async (req, res) => {
  const upload = await prisma.upload.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  })
  if (!upload) return res.status(404).json({ error: 'Upload not found' })
  const rowsPath = `${upload.filePath}.rows.json`
  if (!fs.existsSync(rowsPath)) return res.json([])
  res.json(JSON.parse(fs.readFileSync(rowsPath, 'utf8')))
})

// PUT /api/uploads/:id/mappings
router.put('/:id/mappings', requireAuth, async (req, res) => {
  const upload = await prisma.upload.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  })
  if (!upload) return res.status(404).json({ error: 'Upload not found' })

  const { mappings } = req.body
  await prisma.columnMapping.deleteMany({ where: { uploadId: upload.id } })
  if (Array.isArray(mappings) && mappings.length > 0) {
    await prisma.columnMapping.createMany({
      data: mappings.map((m) => ({
        uploadId: upload.id,
        sourceColumn: m.sourceColumn,
        targetField: m.targetField,
        confidence: m.confidence ?? 0,
        fieldType: m.fieldType ?? null,
      })),
    })
  }
  res.json({ ok: true })
})

// DELETE /api/uploads/:id  — editors and admins only
router.delete('/:id', requireAuth, requireRole('admin', 'editor'), async (req, res) => {
  const upload = await prisma.upload.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  })
  if (!upload) return res.status(404).json({ error: 'Upload not found' })

  if (fs.existsSync(upload.filePath)) fs.unlinkSync(upload.filePath)
  const rowsPath = `${upload.filePath}.rows.json`
  if (fs.existsSync(rowsPath)) fs.unlinkSync(rowsPath)

  await prisma.upload.delete({ where: { id: upload.id } })

  // Evict schema cache for this upload
  const { evictSchemaCache } = await import('../server.js')
  evictSchemaCache(req.user.id, upload.id)

  res.json({ ok: true })
})

export default router
