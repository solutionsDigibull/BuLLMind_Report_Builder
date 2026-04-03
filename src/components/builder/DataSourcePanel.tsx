import { Database, Info, Loader2, Upload, Wand2 } from 'lucide-react'
import type { RefObject } from 'react'

interface Props {
  onConnectSap: () => void
  onUseSample: () => void
  fileInputRef: RefObject<HTMLInputElement>
  isParsing: boolean
}

export default function DataSourcePanel({ onConnectSap, onUseSample, fileInputRef, isParsing }: Props) {
  return (
    <div className="w-full mb-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
          <Info size={16} className="text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">No data source connected</p>
          <p className="text-xs text-gray-400">Connect data to populate charts, KPIs and tables with real values</p>
        </div>
      </div>

      {/* 3 option cards */}
      <div className="grid grid-cols-3 gap-3">

        {/* Upload CSV */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isParsing}
          className="flex flex-col items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-left transition-all group disabled:opacity-60"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
            {isParsing
              ? <Loader2 size={20} className="text-blue-500 animate-spin" />
              : <Upload size={20} className="text-blue-500" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">Upload CSV</p>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              Import a CSV or Excel file exported from any system.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-blue-500 group-hover:text-blue-700 mt-auto">
            {isParsing ? 'Parsing…' : 'Browse file →'}
          </span>
        </button>

        {/* Connect SAP */}
        <button
          onClick={onConnectSap}
          className="flex flex-col items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50 text-left transition-all group"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors">
            <Database size={20} className="text-purple-500" />
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">Connect SAP</p>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              Pull reports or tables directly from your SAP system via the backend.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-purple-500 group-hover:text-purple-700 mt-auto">
            Browse SAP →
          </span>
        </button>

        {/* Use Sample Data */}
        <button
          onClick={onUseSample}
          className="flex flex-col items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-green-300 hover:bg-green-50 text-left transition-all group"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 group-hover:bg-green-100 transition-colors">
            <Wand2 size={20} className="text-green-500" />
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">Use Sample Data</p>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              Load demo data instantly to preview your template with realistic values.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-green-500 group-hover:text-green-700 mt-auto">
            Load demo →
          </span>
        </button>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-gray-400 mt-3 text-center">
        You can always change or replace the data source later from the data bar above.
      </p>
    </div>
  )
}
