import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import prisma from '../lib/prisma.js'

const router = Router()

// GET /api/archives
router.get('/', requireAuth, async (req, res) => {
  const archives = await prisma.archive.findMany({
    where: { userId: req.user.id },
    include: { widgets: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(archives)
})

// POST /api/archives
router.post('/', requireAuth, async (req, res) => {
  const { title, department, source, tags, widgets } = req.body
  const archive = await prisma.archive.create({
    data: {
      userId: req.user.id,
      title: title ?? 'Archived Report',
      department: department ?? 'General',
      widgetCount: (widgets ?? []).length,
      source: source ?? 'manual',
      tags: tags ?? [],
      widgets: {
        create: (widgets ?? []).map((w, i) => ({
          widgetId: w.id ?? w.widgetId,
          type: w.type,
          title: w.title,
          dataField: w.dataField ?? null,
          groupBy: w.groupBy ?? null,
          color: w.color ?? null,
          bgStyle: w.bgStyle ?? 'default',
          span: w.span ?? 1,
          order: w.order ?? i,
        })),
      },
    },
    include: { widgets: { orderBy: { order: 'asc' } } },
  })
  res.status(201).json(archive)
})

// POST /api/archives/:id/restore
router.post('/:id/restore', requireAuth, async (req, res) => {
  const archive = await prisma.archive.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { widgets: { orderBy: { order: 'asc' } } },
  })
  if (!archive) return res.status(404).json({ error: 'Archive not found' })
  res.json(archive)
})

// DELETE /api/archives/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const existing = await prisma.archive.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  })
  if (!existing) return res.status(404).json({ error: 'Archive not found' })
  await prisma.archive.delete({ where: { id: existing.id } })
  res.json({ ok: true })
})

// GET /api/archives/favorites  — template favorites
router.get('/favorites', requireAuth, async (req, res) => {
  const favs = await prisma.favoriteTemplate.findMany({
    where: { userId: req.user.id },
    orderBy: { addedAt: 'desc' },
  })
  res.json(favs.map((f) => f.templateId))
})

// POST /api/archives/favorites/:templateId
router.post('/favorites/:templateId', requireAuth, async (req, res) => {
  await prisma.favoriteTemplate.upsert({
    where: { userId_templateId: { userId: req.user.id, templateId: req.params.templateId } },
    create: { userId: req.user.id, templateId: req.params.templateId },
    update: {},
  })
  res.json({ ok: true })
})

// DELETE /api/archives/favorites/:templateId
router.delete('/favorites/:templateId', requireAuth, async (req, res) => {
  await prisma.favoriteTemplate.deleteMany({
    where: { userId: req.user.id, templateId: req.params.templateId },
  })
  res.json({ ok: true })
})

export default router
