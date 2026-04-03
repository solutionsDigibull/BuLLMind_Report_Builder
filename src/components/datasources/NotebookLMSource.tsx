import { BookOpen, FileText } from 'lucide-react'
import { useRef } from 'react'
import { useStore } from '../../store/useStore'
import { parseFile } from '../../utils/fileParser'
import { autoMapColumns } from '../../utils/columnMapper'

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

export default function NotebookLMSource() {
  const { addUpload, updateUpload, openMapper, showToast } = useStore()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    const id = genId()
    addUpload({ id, name: file.name, size: file.size, status: 'PROCESSING', headers: [], rows: [], mappings: [], standardizedRows: [], uploadedAt: new Date() })
    try {
      const { headers, rows } = await parseFile(file)
      const mappings = autoMapColumns(headers)
      updateUpload(id, { headers, rows, mappings })
      openMapper(id)
    } catch {
      updateUpload(id, { status: 'ERROR' })
      showToast('Could not parse notebook export', 'error')
    }
  }

  return (
    <div className="border-2 border-dashed border-amber-200 rounded-xl p-5 bg-amber-50/20 space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen size={16} className="text-amber-600" />
        <p className="text-xs font-semibold text-gray-700">Import Notebook LM or Jupyter exports</p>
      </div>
      <p className="text-xs text-gray-500">Upload CSV/Excel exports from Google NotebookLM, Jupyter notebooks, or any analytics platform.</p>

      <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.json" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

      <button onClick={() => inputRef.current?.click()}
        className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-amber-200 rounded-xl hover:bg-amber-50 transition-colors cursor-pointer">
        <FileText size={24} className="text-amber-500" />
        <span className="text-xs font-medium text-gray-700">Click to select notebook export</span>
        <span className="text-[10px] text-gray-400">Supports .csv, .xlsx, .json</span>
      </button>

      <div className="text-[10px] text-gray-400">
        Accepted formats: Jupyter .csv exports, NotebookLM data exports, Colab outputs.
      </div>
    </div>
  )
}
