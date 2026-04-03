import {
  Archive as ArchiveIcon,
  Bot,
  LayoutDashboard,
  RotateCcw,
  Search,
  Trash2,
  Wrench,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import type { ArchivedReport } from '../types'

const DEPT_FILTERS = ['All', 'Purchasing', 'Production', 'Quality', 'Logistics', 'Sales']
const SOURCE_FILTERS = ['All', 'Builder', 'AI']

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

const DEPT_STYLES: Record<string, { bg: string; color: string }> = {
  Purchasing: { bg: 'rgba(251,191,36,0.12)',  color: '#b45309' },
  Production: { bg: 'rgba(139,92,246,0.12)',  color: '#7c3aed' },
  Quality:    { bg: 'rgba(239,68,68,0.1)',    color: '#dc2626' },
  Logistics:  { bg: 'rgba(16,185,129,0.12)',  color: '#059669' },
  Sales:      { bg: 'rgba(59,130,246,0.1)',   color: '#2563eb' },
  Finance:    { bg: 'rgba(20,184,166,0.1)',   color: '#0f766e' },
}

function ReportCard({ report, onRestore, onDelete }: {
  report: ArchivedReport
  onRestore: () => void
  onDelete: () => void
}) {
  const dept = DEPT_STYLES[report.department] ?? { bg: 'rgba(100,116,139,0.1)', color: '#475569' }

  return (
    <div
      className="bg-white rounded-2xl p-4 flex flex-col gap-3 card-hover"
      style={{
        boxShadow: '0 1px 3px rgba(30,60,120,0.06), 0 4px 16px rgba(30,60,120,0.06)',
        border: '1px solid rgba(196,210,235,0.6)',
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={
              report.source === 'ai'
                ? { background: 'linear-gradient(135deg, #4f8ef7 0%, #7c5cfc 100%)' }
                : { background: '#f1f5f9', border: '1px solid rgba(196,210,235,0.6)' }
            }
          >
            {report.source === 'ai'
              ? <Bot size={13} className="text-white" />
              : <Wrench size={13} style={{ color: '#64748b' }} />
            }
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate">{report.title}</p>
        </div>
        <span
          className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: dept.bg, color: dept.color }}
        >
          {report.department}
        </span>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 text-[11px]" style={{ color: '#94a3b8' }}>
        <span className="flex items-center gap-1">
          <LayoutDashboard size={10} />
          {report.widgetCount} widgets
        </span>
        <span>·</span>
        <span>{formatDate(report.createdAt)}</span>
        <span>·</span>
        <span
          className="font-semibold"
          style={{ color: report.source === 'ai' ? '#4f8ef7' : '#94a3b8' }}
        >
          {report.source === 'ai' ? 'AI Generated' : 'Builder'}
        </span>
      </div>

      {/* Tags */}
      {report.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {report.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid rgba(196,210,235,0.5)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div
        className="flex items-center gap-2 pt-2"
        style={{ borderTop: '1px solid rgba(196,210,235,0.4)' }}
      >
        <button
          onClick={onRestore}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all"
          style={{ color: '#4f8ef7' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,142,247,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <RotateCcw size={11} />
          Restore to Builder
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: '#cbd5e1' }}
          title="Delete"
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'transparent' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export default function Archive() {
  const { archivedReports, deleteFromArchive, restoreFromArchive, showToast } = useStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All')
  const [sourceFilter, setSourceFilter] = useState('All')

  const filtered = archivedReports.filter((r) => {
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchDept = deptFilter === 'All' || r.department === deptFilter
    const matchSource =
      sourceFilter === 'All' ||
      (sourceFilter === 'AI' && r.source === 'ai') ||
      (sourceFilter === 'Builder' && r.source === 'builder')
    return matchSearch && matchDept && matchSource
  })

  function handleRestore(id: string) {
    restoreFromArchive(id)
    navigate('/builder')
  }

  function handleDelete(id: string, title: string) {
    deleteFromArchive(id)
    showToast(`"${title}" removed from archive.`, 'info')
  }

  return (
    <div className="p-7 max-w-6xl fade-up">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>
            Saved Reports
          </p>
          <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Archive</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            {archivedReports.length} saved report{archivedReports.length !== 1 ? 's' : ''} — restore any into the builder to continue editing.
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(79,142,247,0.1)', color: '#4f8ef7' }}
        >
          <ArchiveIcon size={12} />
          {filtered.length} shown
        </div>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap items-center gap-3 mb-6 p-3 rounded-2xl"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid rgba(196,210,235,0.6)',
          boxShadow: '0 1px 3px rgba(30,60,120,0.04)',
        }}
      >
        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports or tags…"
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none transition-all w-52"
            style={{
              background: '#f8fafc',
              border: '1px solid rgba(196,210,235,0.7)',
              color: '#334155',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#7eb3f7'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,142,247,0.1)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(196,210,235,0.7)'; e.currentTarget.style.boxShadow = 'none' }}
          />
        </div>

        {/* Dept filter */}
        <div className="flex gap-1 flex-wrap">
          {DEPT_FILTERS.map((d) => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className="px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all"
              style={
                deptFilter === d
                  ? { background: 'linear-gradient(135deg, #4f8ef7 0%, #7c5cfc 100%)', color: 'white' }
                  : { background: '#f1f5f9', color: '#64748b', border: '1px solid rgba(196,210,235,0.5)' }
              }
            >
              {d}
            </button>
          ))}
        </div>

        {/* Source filter */}
        <div className="flex gap-1 ml-auto">
          {SOURCE_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className="px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all"
              style={
                sourceFilter === s
                  ? { background: '#1e293b', color: 'white' }
                  : { background: '#f1f5f9', color: '#64748b', border: '1px solid rgba(196,210,235,0.5)' }
              }
            >
              {s === 'AI' ? '✦ AI' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onRestore={() => handleRestore(r.id)}
              onDelete={() => handleDelete(r.id, r.title)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.15)' }}
          >
            <ArchiveIcon size={24} style={{ color: '#94a3b8' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: '#475569' }}>No archived reports found</p>
          <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
            Save a report from the Builder using the "Save to Archive" button.
          </p>
        </div>
      )}
    </div>
  )
}
