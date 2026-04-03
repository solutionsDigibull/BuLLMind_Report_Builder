import { Plus, Trash2, Zap } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { autoMapColumns } from '../../utils/columnMapper'

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

export default function ApiCallSource() {
  const { addUpload, updateUpload, openMapper, showToast } = useStore()
  const [url, setUrl] = useState('https://api.example.com/data')
  const [method, setMethod] = useState<'GET' | 'POST'>('GET')
  const [headers, setHeaders] = useState([{ key: 'Authorization', value: 'Bearer YOUR_TOKEN' }])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [jsonPath, setJsonPath] = useState('')

  const addHeader = () => setHeaders((h) => [...h, { key: '', value: '' }])
  const removeHeader = (i: number) => setHeaders((h) => h.filter((_, idx) => idx !== i))
  const updateHeader = (i: number, field: 'key' | 'value', val: string) =>
    setHeaders((h) => h.map((hh, idx) => idx === i ? { ...hh, [field]: val } : hh))

  const handleFetch = async () => {
    if (!url.trim()) { showToast('Enter a URL', 'error'); return }
    setLoading(true)
    try {
      const headerObj: Record<string, string> = {}
      headers.filter((h) => h.key).forEach((h) => { headerObj[h.key] = h.value })

      const opts: RequestInit = { method, headers: headerObj }
      if (method === 'POST' && body) opts.body = body

      const res = await fetch(url, opts)
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const json = await res.json()

      // Navigate to nested array if jsonPath given
      let arr = json
      if (jsonPath.trim()) {
        jsonPath.split('.').forEach((key) => { if (arr) arr = arr[key] })
      }
      if (!Array.isArray(arr)) {
        // try to find first array in response
        const found = Object.values(json).find(Array.isArray)
        if (found) arr = found
        else arr = [json]
      }

      const rows = arr as Record<string, unknown>[]
      const cols = rows.length > 0 ? Object.keys(rows[0]) : []
      const mappings = autoMapColumns(cols)
      const id = genId()
      const name = `API_${new URL(url).hostname}.json`
      addUpload({ id, name, size: JSON.stringify(rows).length, status: 'PROCESSING', headers: cols, rows, mappings, standardizedRows: [], uploadedAt: new Date() })
      updateUpload(id, { headers: cols, rows, mappings })
      openMapper(id)
    } catch (e: any) {
      showToast(e.message ?? 'Request failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-2 border-dashed border-purple-200 rounded-xl p-5 bg-purple-50/20 space-y-3">
      <p className="text-xs font-semibold text-gray-600">REST API Endpoint</p>

      {/* URL + Method */}
      <div className="flex gap-2">
        <select value={method} onChange={(e) => setMethod(e.target.value as any)}
          className="border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white font-semibold text-blue-700 focus:outline-none">
          <option>GET</option><option>POST</option>
        </select>
        <input value={url} onChange={(e) => setUrl(e.target.value)}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
      </div>

      {/* JSON path */}
      <div>
        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
          JSON Array Path (optional, e.g. <code>data.items</code>)
        </label>
        <input value={jsonPath} onChange={(e) => setJsonPath(e.target.value)} placeholder="data.results"
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
      </div>

      {/* Headers */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Headers</label>
          <button onClick={addHeader} className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
            <Plus size={10} /> Add
          </button>
        </div>
        <div className="space-y-1.5">
          {headers.map((h, i) => (
            <div key={i} className="flex gap-1.5">
              <input value={h.key} onChange={(e) => updateHeader(i, 'key', e.target.value)} placeholder="Key"
                className="w-1/3 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white" />
              <input value={h.value} onChange={(e) => updateHeader(i, 'value', e.target.value)} placeholder="Value"
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white" />
              <button onClick={() => removeHeader(i)} className="text-gray-400 hover:text-red-500">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      {method === 'POST' && (
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Request Body (JSON)</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder='{"query": "..."}'
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-mono resize-none" />
        </div>
      )}

      <button onClick={handleFetch} disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50">
        <Zap size={13} /> {loading ? 'Fetching...' : 'Send Request & Import'}
      </button>
    </div>
  )
}
