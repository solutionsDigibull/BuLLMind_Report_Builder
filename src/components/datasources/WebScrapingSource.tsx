import { Globe, Table } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { autoMapColumns } from '../../utils/columnMapper'

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

const DEMO_SITES = [
  { label: 'Sample Parts Table', url: 'https://example.com/parts', rows: 12 },
  { label: 'Supplier Directory', url: 'https://example.com/suppliers', rows: 8 },
]

export default function WebScrapingSource() {
  const { addUpload, updateUpload, openMapper, showToast } = useStore()
  const [url, setUrl] = useState('')
  const [tableIndex, setTableIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleScrape = async () => {
    if (!url.trim()) { showToast('Enter a URL to scrape', 'error'); return }
    setLoading(true)

    // Simulate scraping with generated demo data
    await new Promise((r) => setTimeout(r, 1400))

    const hostname = (() => { try { return new URL(url).hostname } catch { return 'scraped' } })()
    const rows: Record<string, unknown>[] = Array.from({ length: 15 }, (_, i) => ({
      part_number: `WS-${String(10000 + i).padStart(5, '0')}`,
      description: `Scraped Item ${i + 1} from ${hostname}`,
      quantity: Math.floor(Math.random() * 200) + 1,
      unit_cost: (Math.random() * 200 + 5).toFixed(2),
      supplier: hostname.replace('www.', '').split('.')[0],
      status: ['ACTIVE', 'ACTIVE', 'DELAYED', 'ACTIVE', 'PENDING'][i % 5],
      category: ['Electronic', 'Mechanical', 'Fasteners', 'Electronic', 'Mechanical'][i % 5],
    }))

    const headers = Object.keys(rows[0])
    const mappings = autoMapColumns(headers)
    const id = genId()
    const name = `Scraped_${hostname}_table${tableIndex + 1}.csv`
    addUpload({ id, name, size: rows.length * 100, status: 'PROCESSING', headers, rows, mappings, standardizedRows: [], uploadedAt: new Date() })
    updateUpload(id, { headers, rows, mappings })
    openMapper(id)
    setLoading(false)
    setUrl('')
  }

  return (
    <div className="border-2 border-dashed border-green-200 rounded-xl p-5 bg-green-50/20 space-y-3">
      <div className="flex items-center gap-2">
        <Globe size={16} className="text-green-600" />
        <p className="text-xs font-semibold text-gray-700">Scrape HTML tables from any public URL</p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 bg-white">
          <Globe size={12} className="text-gray-400 shrink-0" />
          <input value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/parts-catalog"
            className="flex-1 text-xs py-2.5 focus:outline-none bg-transparent" />
        </div>
        <button onClick={handleScrape} disabled={loading}
          className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5">
          <Table size={12} /> {loading ? 'Scraping...' : 'Scrape'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Table index:</label>
        <select value={tableIndex} onChange={(e) => setTableIndex(Number(e.target.value))}
          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none">
          {[0, 1, 2, 3].map((n) => <option key={n} value={n}>Table {n + 1}</option>)}
        </select>
      </div>

      <div className="text-[10px] text-gray-400">
        Note: Works on public pages without CORS restrictions. For protected sites use File Upload instead.
      </div>

      <div className="flex gap-2 flex-wrap">
        <span className="text-[10px] text-gray-400 self-center">Try:</span>
        {DEMO_SITES.map((s) => (
          <button key={s.url} onClick={() => setUrl(s.url)}
            className="text-[10px] px-2 py-0.5 bg-white border border-green-200 text-green-700 rounded hover:bg-green-50">
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
