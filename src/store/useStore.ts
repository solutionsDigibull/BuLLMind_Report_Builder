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
import { apiJson } from '../utils/api'

type DataSourceType = 'file' | 'spreadsheet' | 'scraping' | 'claude' | 'api' | 'notebook'

interface AppState {
  // Auth
  isLoggedIn: boolean
  authReady: boolean
  currentUser: { id: string; name: string; email: string } | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  initAuth: () => Promise<void>

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
  loadUploads: () => Promise<void>
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
  saveToArchive: (report: Omit<ArchivedReport, 'id' | 'createdAt'>) => Promise<void>
  deleteFromArchive: (id: string) => Promise<void>
  restoreFromArchive: (id: string) => void

  // Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  clearToast: () => void
}

export const useStore = create<AppState>((set, get) => ({
  isLoggedIn: false,
  authReady: false,
  currentUser: null,
  login: async (email, password) => {
    try {
      // Server sets HttpOnly cookie — response only contains user (no token in body)
      const data = await apiJson<{ user: { id: string; name: string; email: string } }>(
        '/api/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      )
      set({ isLoggedIn: true, currentUser: data.user })
      const [archives] = await Promise.all([
        apiJson<ArchivedReport[]>('/api/archives'),
        get().loadUploads(),
      ])
      set({ archivedReports: archives.map(a => ({ ...a, createdAt: new Date(a.createdAt) })) })
      return true
    } catch {
      return false
    }
  },
  logout: async () => {
    try { await apiJson('/api/auth/logout', { method: 'POST' }) } catch { /* best-effort */ }
    set({ isLoggedIn: false, currentUser: null, archivedReports: [] })
  },
  initAuth: async () => {
    try {
      const user = await apiJson<{ id: string; name: string; email: string }>('/api/auth/me')
      set({ isLoggedIn: true, currentUser: user, authReady: true })
      const [archives] = await Promise.all([
        apiJson<ArchivedReport[]>('/api/archives'),
        get().loadUploads(),
      ])
      set({ archivedReports: archives.map(a => ({ ...a, createdAt: new Date(a.createdAt) })) })
    } catch {
      set({ authReady: true }) // no valid session — stay logged out, but unblock the guard
    }
  },

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
  loadUploads: async () => {
    try {
      const records = await apiJson<Array<{
        id: string; name: string; size: number; status: string
        headers: string[]; uploadedAt: string
        mappings: Array<{ sourceColumn: string; targetField: string; confidence: number; fieldType?: string | null }>
      }>>('/api/uploads')
      set({
        uploads: records.map(r => ({
          id: r.id,
          name: r.name,
          size: r.size,
          status: r.status === 'READY' ? 'READY TO REVIEW' : (r.status as UploadedFile['status']),
          headers: r.headers,
          rows: [],
          standardizedRows: [],
          mappings: r.mappings.map(m => ({ sourceColumn: m.sourceColumn, targetField: m.targetField, confidence: m.confidence, fieldType: m.fieldType ?? undefined })),
          uploadedAt: new Date(r.uploadedAt),
        })),
      })
    } catch { /* not logged in or server down — keep existing local state */ }
  },
  addUpload: (file) => set((s) => ({ uploads: [...s.uploads, file] })),
  updateUpload: (id, patch) =>
    set((s) => ({
      uploads: s.uploads.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    })),
  setActiveFile: (id) => set({ activeFileId: id }),
  deleteUpload: (id) => {
    set((s) => ({
      uploads: s.uploads.filter((u) => u.id !== id),
      activeFileId: s.activeFileId === id ? null : s.activeFileId,
    }))
    apiJson(`/api/uploads/${id}`, { method: 'DELETE' }).catch(() => {})
  },

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
    // Persist mappings to DB — fire-and-forget
    apiJson(`/api/uploads/${fileId}/mappings`, {
      method: 'PUT',
      body: JSON.stringify({ mappings }),
    }).catch(() => {})
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

  archivedReports: [],
  saveToArchive: async (report) => {
    try {
      const saved = await apiJson<ArchivedReport>('/api/archives', {
        method: 'POST',
        body: JSON.stringify(report),
      })
      set((s) => ({
        archivedReports: [{ ...saved, createdAt: new Date(saved.createdAt) }, ...s.archivedReports],
      }))
      get().showToast('Report archived!', 'success')
    } catch {
      // Fallback to local save if not logged in
      set((s) => ({
        archivedReports: [
          { ...report, id: `arc-${Date.now()}`, createdAt: new Date() },
          ...s.archivedReports,
        ],
      }))
      get().showToast('Report archived locally!', 'success')
    }
  },
  deleteFromArchive: async (id) => {
    set((s) => ({ archivedReports: s.archivedReports.filter((r) => r.id !== id) }))
    try {
      await apiJson(`/api/archives/${id}`, { method: 'DELETE' })
    } catch { /* already removed from local state */ }
  },
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
