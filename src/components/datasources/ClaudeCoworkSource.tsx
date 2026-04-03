import { BrainCircuit, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { autoMapColumns } from '../../utils/columnMapper'
import Papa from 'papaparse'

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

const EXAMPLES = [
  'Parse this into a parts list: Part A costs $10, qty 5. Part B costs $25, qty 2. Part C is $8, qty 10.',
  'Convert this table:\nPart | Supplier | Cost | Qty\nBolt M4 | Fastenal | 0.05 | 1000\nNut M4 | Fastenal | 0.03 | 1000',
  'Product: TX-900, Level 1, Assembly: Power Unit, CPN: P-55210, Cost: $145, Status: Active',
]

export default function ClaudeCoworkSource() {
  const { addUpload, updateUpload, openMapper, showToast } = useStore()
  const [text, setText] = useState('')
  const [parsing, setParsing] = useState(false)

  const handleParse = () => {
    if (!text.trim()) { showToast('Enter some data to parse', 'error'); return }
    setParsing(true)

    setTimeout(() => {
      try {
        // Try JSON first
        let rows: Record<string, unknown>[] = []
        try {
          const j = JSON.parse(text)
          rows = Array.isArray(j) ? j : [j]
        } catch {
          // Try CSV/TSV
          const normalized = text.replace(/\t/g, ',')
          const result = Papa.parse(normalized, { header: true, skipEmptyLines: true })
          if (result.data.length > 0 && (result.meta.fields?.length ?? 0) > 1) {
            rows = result.data as Record<string, unknown>[]
          } else {
            // Plain text — try to extract key:value pairs per line
            rows = text.split('\n').filter((l) => l.trim()).map((line) => {
              const obj: Record<string, string> = {}
              const pairs = line.split(/[,;|]/).filter(Boolean)
              pairs.forEach((pair) => {
                const [k, ...v] = pair.split(/[:=]/)
                if (k && v.length) obj[k.trim().replace(/\s+/g, '_').toLowerCase()] = v.join(':').trim()
              })
              if (Object.keys(obj).length === 0) obj.description = line.trim()
              return obj
            })
          }
        }

        if (rows.length === 0) { showToast('Could not parse data — try a CSV or JSON format', 'error'); return }
        const headers = Object.keys(rows[0])
        const mappings = autoMapColumns(headers)
        const id = genId()
        addUpload({ id, name: 'ClaudeCowork_Import.csv', size: text.length, status: 'PROCESSING', headers, rows, mappings, standardizedRows: [], uploadedAt: new Date() })
        updateUpload(id, { headers, rows, mappings })
        openMapper(id)
        setText('')
      } catch (e: any) {
        showToast('Parse error: ' + (e.message ?? 'Unknown'), 'error')
      } finally {
        setParsing(false)
      }
    }, 800)
  }

  return (
    <div className="border-2 border-dashed border-indigo-200 rounded-xl p-5 bg-indigo-50/20 space-y-3">
      <div className="flex items-center gap-2">
        <BrainCircuit size={16} className="text-indigo-600" />
        <p className="text-xs font-semibold text-gray-700">Paste any data format — Claude will parse it</p>
      </div>
      <p className="text-xs text-gray-500">Supports JSON, CSV, tab-separated, plain text, or key:value pairs.</p>

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7}
        placeholder="Paste JSON, CSV, or plain text data here..."
        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono resize-none" />

      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          <span className="text-[10px] text-gray-400 self-center mr-1">Examples:</span>
          {EXAMPLES.map((ex, i) => (
            <button key={i} onClick={() => setText(ex)}
              className="text-[10px] px-2 py-0.5 bg-white border border-indigo-200 text-indigo-600 rounded hover:bg-indigo-50">
              #{i + 1}
            </button>
          ))}
        </div>
        <button onClick={handleParse} disabled={parsing}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          <Sparkles size={13} /> {parsing ? 'Parsing...' : 'Parse & Import'}
        </button>
      </div>
    </div>
  )
}
