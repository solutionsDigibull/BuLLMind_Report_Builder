import {
  BookOpen,
  BrainCircuit,
  Database,
  Download,
  Eye,
  EyeOff,
  FileUp,
  Globe,
  Info,
  LayoutDashboard,
  Link,
  Phone,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SapIntegrationModal, { type SapMode } from '../components/sap/SapIntegrationModal'
import ApiCallSource from '../components/datasources/ApiCallSource'
import ClaudeCoworkSource from '../components/datasources/ClaudeCoworkSource'
import NotebookLMSource from '../components/datasources/NotebookLMSource'
import SpreadsheetLinkSource from '../components/datasources/SpreadsheetLinkSource'
import WebScrapingSource from '../components/datasources/WebScrapingSource'
import FileDropZone from '../components/upload/FileDropZone'
import RecentUploads from '../components/upload/RecentUploads'
import { useStore } from '../store/useStore'
import { STANDARD_FIELD_LABELS } from '../utils/columnMapper'
import { exportToCsv } from '../utils/exportCsv'

const DATA_SOURCES = [
  {
    key: 'file' as const,
    icon: <FileUp size={20} />,
    label: 'File Upload',
    description: 'Import CSV or Excel files from your computer.',
    tooltip: 'Upload CSV or Excel files to manually import structured data. Best for one-time imports or files exported from any system.',
    steps: ['Click "Browse file" or drag & drop your CSV/Excel file', 'Review the auto-detected column mappings', 'Click "Apply & Continue" — data loads into the builder'],
    color: 'blue',
  },
  {
    key: 'spreadsheet' as const,
    icon: <Link size={20} />,
    label: 'Spreadsheet Link',
    description: 'Connect a Google Sheet or Excel Online URL.',
    tooltip: 'Link directly to a Google Sheet or Microsoft Excel Online file. Useful when data is maintained by a team and needs to stay up to date.',
    steps: ['Paste the share URL of your spreadsheet', 'Grant read access if your sheet is restricted', 'Data is fetched and mapped automatically'],
    color: 'emerald',
  },
  {
    key: 'scraping' as const,
    icon: <Globe size={20} />,
    label: 'Web Scraping',
    description: 'Extract structured data from any web page.',
    tooltip: 'Automatically extract tables and structured data from public web pages. Useful for pulling pricing, supplier lists, or public reports.',
    steps: ['Enter the URL of the page to scrape', 'Select the table or data block to extract', 'Data is parsed and loaded for mapping'],
    color: 'violet',
  },
  {
    key: 'claude' as const,
    icon: <BrainCircuit size={20} />,
    label: 'Claude Cowork',
    description: 'Generate or transform data using Claude AI.',
    tooltip: 'Use Claude to generate sample datasets, clean messy data, or transform raw text into structured rows. Great for prototyping or enrichment.',
    steps: ['Describe the data you need or paste raw content', 'Claude generates or structures it for you', 'Review the output and confirm import'],
    color: 'amber',
  },
  {
    key: 'api' as const,
    icon: <Phone size={20} />,
    label: 'API Call',
    description: 'Fetch data dynamically from external systems.',
    tooltip: 'Connect to any REST API endpoint to pull live data into BuLLMind. Suitable for ERP systems, databases, or third-party services with an API.',
    steps: ['Enter your API endpoint URL and headers', 'Configure authentication if required', 'Data is fetched and auto-mapped on each load'],
    color: 'rose',
  },
  {
    key: 'notebook' as const,
    icon: <BookOpen size={20} />,
    label: 'Notebook LM',
    description: 'Import data from a Google NotebookLM source.',
    tooltip: 'Pull structured knowledge and data exports from Google NotebookLM. Useful when your analysis already lives in a research notebook.',
    steps: ['Connect your NotebookLM workspace', 'Select the notebook or data export to use', 'Data is imported and ready to map'],
    color: 'cyan',
  },
]

const SAP_SOURCE = {
  key: 'sap' as const,
  icon: <Database size={20} />,
  label: 'SAP Integration',
  description: 'Connect to SAP S/4HANA or upload SAP output files.',
  tooltip: 'Connect directly to SAP S/4HANA to browse and import reports & tables, or upload CSV files exported from any SAP transaction.',
  steps: ['Click "SAP Integration" to open the connection panel', 'Choose "SAP Live Connection" or "Upload SAP Output (CSV)"', 'Data is automatically mapped from SAP field names'],
  color: 'purple',
}

export default function DataIntegration() {
  const {
    activeDataSource,
    setActiveDataSource,
    uploads,
    activeFileId,
    showToast,
  } = useStore()
  const navigate = useNavigate()

  const activeFile = uploads.find((u) => u.id === activeFileId)
  const tableRows = activeFile?.standardizedRows ?? []
  const tableHeaders = tableRows.length > 0 ? Object.keys(tableRows[0]) : []

  // SAP modal state
  const [sapMode, setSapMode] = useState<SapMode | null>(null)

  const [guideOpen, setGuideOpen] = useState(false)

  // Column filter state
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())
  const [showColFilter, setShowColFilter] = useState(false)
  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false)
  // Paginate table
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10
  const visibleHeaders = tableHeaders.filter((h) => !hiddenCols.has(h))
  const pagedRows = tableRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(tableRows.length / PAGE_SIZE)

  const toggleCol = (h: string) =>
    setHiddenCols((prev) => {
      const next = new Set(prev)
      next.has(h) ? next.delete(h) : next.add(h)
      return next
    })

  const handleExportReport = () => {
    if (tableRows.length === 0) {
      showToast('No data to export — upload and map a file first.', 'info')
      return
    }
    const filename = `${activeFile?.name.replace(/\.[^.]+$/, '') ?? 'report'}_export`
    exportToCsv(tableRows, filename)
    showToast('Report exported as CSV!', 'success')
  }

  const handleExportTable = () => {
    if (tableRows.length === 0) return
    const filtered = tableRows.map((row) => {
      const out: Record<string, unknown> = {}
      visibleHeaders.forEach((h) => { out[h] = row[h] })
      return out
    })
    exportToCsv(filtered, activeFile?.name.replace(/\.[^.]+$/, '') ?? 'data')
    showToast('Table exported!', 'success')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Data Source</h1>
        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download size={14} />
          Export Report
        </button>
      </div>

      {/* Data Source Selection */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Data Source Selection
          </p>
          <button
            onClick={() => setGuideOpen(true)}
            className="text-[11px] text-blue-500 hover:text-blue-700 hover:underline transition-colors"
          >
            Not sure which option to use?
          </button>
        </div>

        {/* Row 1 — 4 items */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {DATA_SOURCES.slice(0, 4).map((src) => {
            const isActive = activeDataSource === src.key
            return (
              <div
                key={src.key}
                onClick={() => setActiveDataSource(src.key)}
                className={`rounded-xl border transition-all cursor-pointer ${
                  isActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center gap-1.5 p-4">
                  <span className={isActive ? 'text-blue-600' : 'text-gray-400'}>{src.icon}</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium leading-tight ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>{src.label}</span>
                    <div className="relative group/tip">
                      <Info size={11} className="text-gray-300 hover:text-blue-400 cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 bg-gray-900 text-white text-[10px] rounded-lg leading-relaxed opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-30">
                        {src.tooltip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Row 2 — API Call, Notebook LM, SAP */}
        <div className="grid grid-cols-3 gap-2">
          {DATA_SOURCES.slice(4).map((src) => {
            const isActive = activeDataSource === src.key
            return (
              <div
                key={src.key}
                onClick={() => setActiveDataSource(src.key)}
                className={`rounded-xl border transition-all cursor-pointer ${
                  isActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center gap-1.5 p-4">
                  <span className={isActive ? 'text-blue-600' : 'text-gray-400'}>{src.icon}</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium leading-tight ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>{src.label}</span>
                    <div className="relative group/tip">
                      <Info size={11} className="text-gray-300 hover:text-blue-400 cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 bg-gray-900 text-white text-[10px] rounded-lg leading-relaxed opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-30">
                        {src.tooltip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* SAP card */}
          <div
            onClick={() => setSapMode('reports')}
            className="rounded-xl border border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer"
          >
            <div className="flex flex-col items-center gap-1.5 p-4">
              <span className="text-gray-400">{SAP_SOURCE.icon}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-gray-600">{SAP_SOURCE.label}</span>
                <div className="relative group/tip">
                  <Info size={11} className="text-gray-300 hover:text-purple-400 cursor-help transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 bg-gray-900 text-white text-[10px] rounded-lg leading-relaxed opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-30">
                    {SAP_SOURCE.tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contextual How-to-Use Panel */}
      {(() => {
        const active = DATA_SOURCES.find(s => s.key === activeDataSource)
        if (!active) return null
        return (
          <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 flex items-start gap-6">
            <div className="shrink-0 min-w-[130px]">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">How to use</p>
              <p className="text-xs font-semibold text-blue-700 mt-0.5">{active.label}</p>
              <p className="text-[10px] text-blue-500/80 mt-0.5 leading-relaxed">{active.description}</p>
            </div>
            <div className="flex items-start gap-5 flex-wrap flex-1">
              {active.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 max-w-[200px]">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold text-[9px] mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-[11px] text-blue-700 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Comparison guide modal */}
      {guideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setGuideOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Which data source should I use?</h2>
                <p className="text-xs text-gray-400 mt-0.5">A quick guide to choosing the right option</p>
              </div>
              <button onClick={() => setGuideOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <X size={15} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
              {[...DATA_SOURCES, SAP_SOURCE].map((src) => {
                const colorMap: Record<string, string> = {
                  blue: 'bg-blue-50 border-blue-100 text-blue-600',
                  emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
                  violet: 'bg-violet-50 border-violet-100 text-violet-600',
                  amber: 'bg-amber-50 border-amber-100 text-amber-600',
                  rose: 'bg-rose-50 border-rose-100 text-rose-600',
                  cyan: 'bg-cyan-50 border-cyan-100 text-cyan-600',
                  purple: 'bg-purple-50 border-purple-100 text-purple-600',
                }
                const cls = colorMap[src.color] ?? colorMap.blue
                return (
                  <div key={src.key} className={`flex gap-3 p-3.5 rounded-xl border ${cls.split(' ').slice(0, 2).join(' ')}`}>
                    <span className={`shrink-0 mt-0.5 ${cls.split(' ')[2]}`}>{src.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{src.label}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{src.tooltip}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upload area + Quick Stats side by side */}
      <div className="grid grid-cols-3 gap-5 mt-6">
        <div className="col-span-2 space-y-4">
          {activeDataSource === 'file' && <FileDropZone />}
          {activeDataSource === 'spreadsheet' && <SpreadsheetLinkSource />}
          {activeDataSource === 'scraping' && <WebScrapingSource />}
          {activeDataSource === 'claude' && <ClaudeCoworkSource />}
          {activeDataSource === 'api' && <ApiCallSource />}
          {activeDataSource === 'notebook' && <NotebookLMSource />}

          <RecentUploads />
        </div>

        {/* Quick Stats */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Quick Stats
          </p>
          {uploads.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
              <p className="text-xs text-gray-400">Upload a file to see stats</p>
            </div>
          ) : (
            <>
              <StatCard label="Files Uploaded" value={uploads.length} />
              <StatCard
                label="Ready to Review"
                value={uploads.filter((u) => u.status === 'READY TO REVIEW').length}
                color="text-green-600"
              />
              <StatCard
                label="Total Rows"
                value={uploads.reduce((s, u) => s + u.rows.length, 0).toLocaleString()}
              />
              {activeFile && (
                <StatCard
                  label="Active File Columns"
                  value={activeFile.headers.length}
                  color="text-blue-600"
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Data Table */}
      {tableRows.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {activeFile?.name.replace(/\.(csv|xlsx|json)$/i, '') ?? 'Data Preview'}
              </h2>
              <p className="text-xs text-gray-500">
                Reviewing {tableRows.length.toLocaleString()} validated records from current workspace
              </p>
            </div>
            <div className="flex gap-2 relative">
              <button
                onClick={() => setShowColFilter((v) => !v)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1"
              >
                {showColFilter ? <EyeOff size={12} /> : <Eye size={12} />}
                Filter columns {hiddenCols.size > 0 && `(${hiddenCols.size} hidden)`}
              </button>
              <button
                onClick={handleExportTable}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1"
              >
                <Download size={12} />
                CSV
              </button>

              {/* Column filter dropdown */}
              {showColFilter && (
                <div className="absolute right-0 top-9 z-30 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-56">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-700">Toggle Columns</p>
                    <button onClick={() => setShowColFilter(false)}>
                      <X size={12} className="text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                    {tableHeaders.map((h) => (
                      <label key={h} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded text-xs">
                        <input
                          type="checkbox"
                          checked={!hiddenCols.has(h)}
                          onChange={() => toggleCol(h)}
                          className="accent-blue-600"
                        />
                        <span className="text-gray-700">
                          {STANDARD_FIELD_LABELS[h as keyof typeof STANDARD_FIELD_LABELS] ?? h}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setHiddenCols(new Set())}
                      className="flex-1 text-[10px] py-1 border border-gray-200 rounded text-gray-600 hover:bg-gray-50"
                    >
                      Show All
                    </button>
                    <button
                      onClick={() => setHiddenCols(new Set(tableHeaders))}
                      className="flex-1 text-[10px] py-1 border border-gray-200 rounded text-gray-600 hover:bg-gray-50"
                    >
                      Hide All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {visibleHeaders.map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {STANDARD_FIELD_LABELS[h as keyof typeof STANDARD_FIELD_LABELS] ?? h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      {visibleHeaders.map((h) => {
                        const val = String(row[h] ?? '')
                        const isStatus = h === 'status'
                        return (
                          <td key={h} className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                            {isStatus ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                  val.toUpperCase() === 'ACTIVE'
                                    ? 'bg-green-100 text-green-700'
                                    : val.toUpperCase() === 'DELAYED'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {val}
                              </span>
                            ) : (
                              val
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                <span className="text-xs text-gray-500">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, tableRows.length)} of {tableRows.length.toLocaleString()} rows
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-white"
                  >
                    ← Prev
                  </button>
                  <span className="px-3 py-1 text-xs text-gray-600">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-white"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleExportTable}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download size={13} />
              Export CSV
            </button>
            <button
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Eye size={13} />
              Preview
            </button>
            <button
              onClick={() => navigate('/builder')}
              className="flex items-center gap-1.5 px-5 py-2 text-sm bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              <LayoutDashboard size={13} />
              Drag &amp; Drop
            </button>
          </div>
        </div>
      )}

      {/* SAP Integration Modal */}
      {sapMode && <SapIntegrationModal mode={sapMode} onClose={() => setSapMode(null)} />}

      {/* Preview Modal */}
      {previewOpen && (
        <PreviewModal
          headers={visibleHeaders}
          rows={tableRows}
          filename={activeFile?.name ?? 'data'}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  color = 'text-gray-900',
}: {
  label: string
  value: string | number
  color?: string
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-white">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

function PreviewModal({
  headers,
  rows,
  filename,
  onClose,
}: {
  headers: string[]
  rows: { [k: string]: unknown }[]
  filename: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Full Data Preview</h2>
            <p className="text-xs text-gray-500 mt-0.5">{filename} — {rows.length.toLocaleString()} rows</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                {headers.map((h) => (
                  <th key={h} className="sticky top-0 z-10 px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50">
                    {STANDARD_FIELD_LABELS[h as keyof typeof STANDARD_FIELD_LABELS] ?? h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  {headers.map((h) => (
                    <td key={h} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {String(row[h] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex-shrink-0 px-6 py-3 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Close</button>
        </div>
      </div>
    </div>
  )
}
