import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import prisma from '../lib/prisma.js'

const router = Router()

// GET /api/reports
router.get('/', requireAuth, async (req, res) => {
  const reports = await prisma.report.findMany({
    where: { userId: req.user.id },
    include: { widgets: { orderBy: { order: 'asc' } } },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(reports)
})

// GET /api/reports/:id
router.get('/:id', requireAuth, async (req, res) => {
  const report = await prisma.report.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { widgets: { orderBy: { order: 'asc' } } },
  })
  if (!report) return res.status(404).json({ error: 'Report not found' })
  res.json(report)
})

// POST /api/reports
router.post('/', requireAuth, async (req, res) => {
  const { title, department, status, widgets } = req.body
  const report = await prisma.report.create({
    data: {
      userId: req.user.id,
      title: title ?? 'Untitled Report',
      department: department ?? null,
      status: status ?? 'draft',
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
  res.status(201).json(report)
})

// PUT /api/reports/:id
router.put('/:id', requireAuth, async (req, res) => {
  const existing = await prisma.report.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  })
  if (!existing) return res.status(404).json({ error: 'Report not found' })

  const { title, department, status, widgets } = req.body
  await prisma.reportWidget.deleteMany({ where: { reportId: existing.id } })

  const report = await prisma.report.update({
    where: { id: existing.id },
    data: {
      title: title ?? existing.title,
      department: department ?? existing.department,
      status: status ?? existing.status,
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
  res.json(report)
})

// DELETE /api/reports/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const existing = await prisma.report.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  })
  if (!existing) return res.status(404).json({ error: 'Report not found' })
  await prisma.report.delete({ where: { id: existing.id } })
  res.json({ ok: true })
})

export default router
