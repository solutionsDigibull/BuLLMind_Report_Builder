import { create } from 'zustand'
import type {
  AnalysisPurpose,
  ArchivedReport,
  ColumnMapping,
  Department,
  Row,
  UploadedFile,
  WidgetConfig,
} from '../types'
import { SEED_ACTIVE_FILE_ID, SEED_CANVAS_WIDGETS, SEED_FILES } from '../utils/seedData'

type DataSourceType = 'file' | 'spreadsheet' | 'scraping' | 'claude' | 'api' | 'notebook'

interface AppState {
  // Auth
  isLoggedIn: boolean
  currentUser: { name: string; email: string } | null
  login: (email: string, password: string) => boolean
  logout: () => void

  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (t: 'light' | 'dark' | 'system') => void

  // Workspace
  analysisPurpose: AnalysisPurpose
  activeDepartment: Department
  activeDataSource: DataSourceType
  setAnalysisPurpose: (p: AnalysisPurpose) => void
  setActiveDepartment: (d: Department) => void
  setActiveDataSource: (s: DataSourceType) => void

  // Uploads
  uploads: UploadedFile[]
  activeFileId: string | null
  addUpload: (file: UploadedFile) => void
  updateUpload: (id: string, patch: Partial<UploadedFile>) => void
  setActiveFile: (id: string) => void
  deleteUpload: (id: string) => void

  // Column mapping modal
  mappingFileId: string | null
  openMapper: (fileId: string) => void
  closeMapper: () => void
  applyMappings: (fileId: string, mappings: ColumnMapping[]) => void

  // Builder canvas
  canvasWidgets: WidgetConfig[]
  selectedWidgetId: string | null
  reportTitle: string
  templatesUsed: number
  _history: WidgetConfig[][]
  _future: WidgetConfig[][]
  addWidget: (w: WidgetConfig) => void
  updateWidget: (id: string, patch: Partial<WidgetConfig>) => void
  removeWidget: (id: string) => void
  reorderWidgets: (widgets: WidgetConfig[]) => void
  duplicateWidget: (id: string) => void
  selectWidget: (id: string | null) => void
  setReportTitle: (t: string) => void
  loadTemplate: (widgets: WidgetConfig[], title?: string) => void
  undo: () => void
  redo: () => void

  // Favorites
  favoriteTemplates: Set<string>
  toggleFavorite: (id: string) => void

  // Archive
  archivedReports: ArchivedReport[]
  saveToArchive: (report: Omit<ArchivedReport, 'id' | 'createdAt'>) => void
  deleteFromArchive: (id: string) => void
  restoreFromArchive: (id: string) => void

  // Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  clearToast: () => void
}

export const useStore = create<AppState>((set, get) => ({
  isLoggedIn: false,
  currentUser: null,
  login: (email, password) => {
    if (!email.trim() || !password.trim()) return false
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    set({ isLoggedIn: true, currentUser: { name, email } })
    return true
  },
  logout: () => set({ isLoggedIn: false, currentUser: null }),

  theme: 'light',
  setTheme: (t) => set({ theme: t }),

  analysisPurpose: 'Deep Analysis',
  activeDepartment: 'Production',
  activeDataSource: 'file',
  setAnalysisPurpose: (p) => set({ analysisPurpose: p }),
  setActiveDepartment: (d) => set({ activeDepartment: d }),
  setActiveDataSource: (s) => set({ activeDataSource: s }),

  uploads: [],
  activeFileId: null,
  addUpload: (file) => set((s) => ({ uploads: [...s.uploads, file] })),
  updateUpload: (id, patch) =>
    set((s) => ({
      uploads: s.uploads.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    })),
  setActiveFile: (id) => set({ activeFileId: id }),
  deleteUpload: (id) =>
    set((s) => ({
      uploads: s.uploads.filter((u) => u.id !== id),
      activeFileId: s.activeFileId === id ? null : s.activeFileId,
    })),

  mappingFileId: null,
  openMapper: (fileId) => set({ mappingFileId: fileId }),
  closeMapper: () => set({ mappingFileId: null }),
  applyMappings: (fileId, mappings) => {
    const file = get().uploads.find((u) => u.id === fileId)
    if (!file) return
    const standardizedRows: Row[] = file.rows.map((row) => {
      const out: Row = {}
      mappings.forEach((m) => {
        if (m.targetField === 'ignore') return
        // 'custom' → preserve the original column name as the key
        const outputKey = m.targetField === 'custom' ? m.sourceColumn : m.targetField
        out[outputKey] = row[m.sourceColumn]
      })
      return out
    })
    get().updateUpload(fileId, { mappings, standardizedRows, status: 'READY TO REVIEW' })
    set({ mappingFileId: null, activeFileId: fileId })
    get().showToast('Column mappings applied — data is ready!', 'success')
  },

  canvasWidgets: [],
  selectedWidgetId: null,
  reportTitle: 'Untitled Report',
  templatesUsed: 0,
  _history: [],
  _future: [],
  addWidget: (w) =>
    set((s) => ({
      _history: [...s._history.slice(-30), s.canvasWidgets],
      _future: [],
      canvasWidgets: [...s.canvasWidgets, w],
    })),
  updateWidget: (id, patch) =>
    set((s) => ({
      _history: [...s._history.slice(-30), s.canvasWidgets],
      _future: [],
      canvasWidgets: s.canvasWidgets.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    })),
  removeWidget: (id) =>
    set((s) => ({
      _history: [...s._history.slice(-30), s.canvasWidgets],
      _future: [],
      canvasWidgets: s.canvasWidgets.filter((w) => w.id !== id),
      selectedWidgetId: s.selectedWidgetId === id ? null : s.selectedWidgetId,
    })),
  reorderWidgets: (widgets) =>
    set((s) => ({
      _history: [...s._history.slice(-30), s.canvasWidgets],
      _future: [],
      canvasWidgets: widgets,
    })),
  duplicateWidget: (id) =>
    set((s) => {
      const src = s.canvasWidgets.find((w) => w.id === id)
      if (!src) return {}
      const copy: WidgetConfig = {
        ...src,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        title: src.title + ' (copy)',
        order: src.order + 0.5,
      }
      const updated = [...s.canvasWidgets, copy].map((w, i) => ({ ...w, order: i }))
      return {
        _history: [...s._history.slice(-30), s.canvasWidgets],
        _future: [],
        canvasWidgets: updated,
      }
    }),
  selectWidget: (id) => set({ selectedWidgetId: id }),
  setReportTitle: (t) => set({ reportTitle: t }),
  loadTemplate: (widgets, title) =>
    set((s) => ({
      _history: [...s._history.slice(-30), s.canvasWidgets],
      _future: [],
      canvasWidgets: widgets,
      reportTitle: title ?? 'Untitled Report',
      selectedWidgetId: null,
      templatesUsed: s.templatesUsed + 1,
    })),
  undo: () =>
    set((s) => {
      if (s._history.length === 0) return {}
      const prev = s._history[s._history.length - 1]
      return {
        _history: s._history.slice(0, -1),
        _future: [s.canvasWidgets, ...s._future.slice(0, 30)],
        canvasWidgets: prev,
      }
    }),
  redo: () =>
    set((s) => {
      if (s._future.length === 0) return {}
      const next = s._future[0]
      return {
        _history: [...s._history.slice(-30), s.canvasWidgets],
        _future: s._future.slice(1),
        canvasWidgets: next,
      }
    }),

  favoriteTemplates: new Set(['bom-review', 'prod-efficiency']),
  toggleFavorite: (id) =>
    set((s) => {
      const next = new Set(s.favoriteTemplates)
      next.has(id) ? next.delete(id) : next.add(id)
      return { favoriteTemplates: next }
    }),

  archivedReports: [
    {
      id: 'arc-1',
      title: 'BOM Report — Project Phoenix',
      department: 'Production',
      widgetCount: 6,
      widgets: [],
      source: 'builder',
      tags: ['BOM', 'Costing'],
      createdAt: new Date('2026-03-10T09:30:00'),
    },
    {
      id: 'arc-2',
      title: 'Purchasing Spend Analysis Q1',
      department: 'Purchasing',
      widgetCount: 5,
      widgets: [],
      source: 'builder',
      tags: ['Spend', 'Vendors'],
      createdAt: new Date('2026-03-15T14:00:00'),
    },
    {
      id: 'arc-3',
      title: 'Production Efficiency Dashboard',
      department: 'Production',
      widgetCount: 6,
      widgets: [],
      source: 'ai',
      tags: ['OEE', 'Downtime'],
      createdAt: new Date('2026-03-18T11:15:00'),
    },
    {
      id: 'arc-4',
      title: 'Logistics Overview — March',
      department: 'Logistics',
      widgetCount: 4,
      widgets: [],
      source: 'ai',
      tags: ['Shipments', 'Delivery'],
      createdAt: new Date('2026-03-22T08:45:00'),
    },
    {
      id: 'arc-5',
      title: 'Quality Control Summary',
      department: 'Quality',
      widgetCount: 6,
      widgets: [],
      source: 'builder',
      tags: ['Defects', 'Inspection'],
      createdAt: new Date('2026-03-25T16:20:00'),
    },
  ] as ArchivedReport[],
  saveToArchive: (report) =>
    set((s) => ({
      archivedReports: [
        { ...report, id: `arc-${Date.now()}`, createdAt: new Date() },
        ...s.archivedReports,
      ],
    })),
  deleteFromArchive: (id) =>
    set((s) => ({ archivedReports: s.archivedReports.filter((r) => r.id !== id) })),
  restoreFromArchive: (id) => {
    const report = get().archivedReports.find((r) => r.id === id)
    if (!report) return
    get().loadTemplate(report.widgets, report.title)
    get().showToast(`"${report.title}" restored to builder!`, 'success')
  },

  toast: null,
  showToast: (message, type = 'info') => {
    set({ toast: { message, type } })
    setTimeout(() => get().clearToast(), 3500)
  },
  clearToast: () => set({ toast: null }),
}))
