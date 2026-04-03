import { ArchiveIcon, ArrowLeft, CheckCircle, Download, Edit3, FileDown, FileText, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Canvas from '../components/builder/Canvas'
import ComponentPanel from '../components/builder/ComponentPanel'
import PropertiesPanel from '../components/builder/PropertiesPanel'
import { useStore } from '../store/useStore'
import { exportToCsv } from '../utils/exportCsv'

export default function Builder() {
  const navigate = useNavigate()
  const { reportTitle, setReportTitle, canvasWidgets, activeDepartment, saveToArchive, showToast, selectedWidgetId, uploads, activeFileId } = useStore()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(reportTitle)
  const [componentPanelOpen, setComponentPanelOpen] = useState(true)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // Close export menu when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const activeFile = activeFileId ? uploads.find(u => u.id === activeFileId) : null
  const exportRows = activeFile?.standardizedRows.length
    ? activeFile.standardizedRows
    : uploads.find(u => u.standardizedRows.length > 0)?.standardizedRows ?? []

  function handleExportPDF() {
    setShowExportMenu(false)
    window.print()
  }

  function handleExportCSV() {
    setShowExportMenu(false)
    if (exportRows.length === 0) {
      showToast('No data loaded — upload a file first', 'error')
      return
    }
    exportToCsv(exportRows, reportTitle)
    showToast('CSV downloaded!', 'success')
  }

  function handleSaveToArchive() {
    saveToArchive({
      title: reportTitle,
      department: activeDepartment,
      widgetCount: canvasWidgets.length,
      widgets: canvasWidgets,
      source: 'builder',
      tags: [],
    })
    showToast(`"${reportTitle}" saved to Archive!`, 'success')
  }

  const commitTitle = () => {
    setReportTitle(titleDraft)
    setEditingTitle(false)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel — collapsible */}
      <div className={`no-print transition-[width] duration-200 overflow-hidden shrink-0 ${componentPanelOpen ? 'w-52' : 'w-0'}`}>
        <ComponentPanel />
      </div>

      {/* Main canvas area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Builder top bar */}
        <div className="no-print flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          {/* Back to Data Sources */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            title="Back to Data Sources"
          >
            <ArrowLeft size={14} />
            Data Sources
          </button>
          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* Component panel toggle */}
          <button
            onClick={() => setComponentPanelOpen(v => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
            title={componentPanelOpen ? 'Hide components panel' : 'Show components panel'}
          >
            {componentPanelOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          </button>
          <div className="w-px h-5 bg-gray-200 shrink-0" />
          {editingTitle ? (
            <input
              autoFocus
              className="text-base font-semibold text-gray-900 border-b-2 border-blue-500 outline-none bg-transparent px-1"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => e.key === 'Enter' && commitTitle()}
            />
          ) : (
            <button
              onClick={() => { setTitleDraft(reportTitle); setEditingTitle(true) }}
              className="flex items-center gap-1.5 group"
            >
              <span className="text-base font-semibold text-gray-900">{reportTitle}</span>
              <Edit3 size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
            </button>
          )}
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
            <CheckCircle size={10} />
            Live Editing
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleSaveToArchive}
              disabled={canvasWidgets.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ArchiveIcon size={13} />
              Save to Archive
            </button>

            {/* Export dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(v => !v)}
                disabled={canvasWidgets.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-40 transition-colors"
              >
                <Download size={13} />
                Export
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Export As</p>
                  </div>
                  <button
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <FileText size={13} className="text-red-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-800">Download PDF</p>
                      <p className="text-[10px] text-gray-400">Print to PDF via browser</p>
                    </div>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                      <FileDown size={13} className="text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-800">Export Data (CSV)</p>
                      <p className="text-[10px] text-gray-400">Download raw data as CSV</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <Canvas />
        </div>
      </div>

      {/* Right properties panel — slides in when a widget is selected */}
      <div className={`no-print transition-[width] duration-200 overflow-hidden shrink-0 ${selectedWidgetId ? 'w-60' : 'w-0'}`}>
        <PropertiesPanel />
      </div>
    </div>
  )
}
