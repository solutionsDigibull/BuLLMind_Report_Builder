import { AlertTriangle, ClipboardCopy, ExternalLink, Link2 } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { autoMapColumns } from '../../utils/columnMapper'
import Papa from 'papaparse'

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

function extractSheetId(rawUrl: string): string | null {
  const m = rawUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
  return m ? m[1] : null
}

export default function SpreadsheetLinkSource() {
  const { addUpload, openMapper, showToast } = useStore()
  const [url, setUrl] = useState('')
  const [pasted, setPasted] = useState('')
  const [tab, setTab] = useState<'url' | 'paste'>('url')
  const [corsBlocked, setCorsBlocked] = useState(false)

  // Direct browser→Google Sheets fetch is always blocked by CORS.
  // We detect this, explain it clearly, and guide to the Paste tab.
  const handleUrl = () => {
    if (!url.trim()) { showToast('Enter a Google Sheets share URL', 'error'); return }
    if (!extractSheetId(url)) { showToast('Invalid Google Sheets URL — check the link format', 'error'); return }
    setCorsBlocked(true)
  }

  const handlePaste = () => {
    if (!pasted.trim()) { showToast('Paste your spreadsheet data first', 'error'); return }
    importCsvText(pasted, 'PastedSpreadsheet.csv')
  }

  const importCsvText = (text: string, name: string) => {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true })
    const headers = (result.meta.fields ?? []) as string[]
    const rows = result.data as Record<string, unknown>[]
    if (rows.length === 0) { showToast('No data found — make sure your first row has column headers', 'error'); return }
    const mappings = autoMapColumns(headers)
    const id = genId()
    addUpload({ id, name, size: text.length, status: 'PROCESSING', headers, rows, mappings, standardizedRows: [], uploadedAt: new Date() })
    openMapper(id)
    setPasted('')
    setUrl('')
    setCorsBlocked(false)
  }

  const sheetId = extractSheetId(url)
  const openInSheetsUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}` : url

  return (
    <div className="border-2 border-dashed border-blue-200 rounded-xl p-5 bg-blue-50/30 space-y-4">
      <div className="flex gap-2 mb-2">
        {(['url', 'paste'] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setCorsBlocked(false) }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t === 'url' ? 'Google Sheets URL' : 'Paste Data'}
          </button>
        ))}
      </div>

      {tab === 'url' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Paste your Google Sheets link to open it, then copy the data into the <strong>Paste Data</strong> tab.
          </p>

          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 bg-white">
              <Link2 size={13} className="text-gray-400 shrink-0" />
              <input
                value={url}
                onChange={(e) => { setUrl(e.target.value); setCorsBlocked(false) }}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 text-xs py-2.5 focus:outline-none bg-transparent"
              />
            </div>
            <button
              onClick={handleUrl}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
            >
              <ExternalLink size={12} /> Open
            </button>
          </div>

          {/* CORS explanation — shown once user tries to import */}
          {corsBlocked && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">Direct import is blocked by Google</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                    Browsers cannot fetch Google Sheets directly — Google blocks cross-origin requests for security.
                    This is a browser restriction, not a bug.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-amber-100 p-3 space-y-2">
                <p className="text-[11px] font-semibold text-gray-700">Workaround — 3 steps:</p>
                <ol className="space-y-1.5">
                  {[
                    { icon: <ExternalLink size={11} />, text: 'Open the sheet in Google Sheets' },
                    { icon: <ClipboardCopy size={11} />, text: 'Select all cells (Ctrl+A) and copy (Ctrl+C)' },
                    { icon: <ClipboardCopy size={11} />, text: 'Switch to the "Paste Data" tab and paste' },
                  ].map((step, i) => (
                    <li key={i} className="flex items-center gap-2 text-[11px] text-gray-600">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[9px] shrink-0">{i + 1}</span>
                      <span className="text-gray-400">{step.icon}</span>
                      {step.text}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex gap-2">
                <a
                  href={openInSheetsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink size={11} /> Open in Google Sheets
                </a>
                <button
                  onClick={() => { setTab('paste'); setCorsBlocked(false) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ClipboardCopy size={11} /> Go to Paste Tab →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'paste' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Open your spreadsheet, select all cells (<kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Ctrl+A</kbd>),
            copy (<kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Ctrl+C</kbd>), and paste below.
            Works with Google Sheets, Excel, and LibreOffice.
          </p>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={7}
            placeholder="Paste your spreadsheet data here..."
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono resize-none"
          />
          <button
            onClick={handlePaste}
            disabled={!pasted.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Import Pasted Data
          </button>
        </div>
      )}
    </div>
  )
}
