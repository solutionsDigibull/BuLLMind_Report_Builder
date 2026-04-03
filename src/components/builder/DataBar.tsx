import { Database, FlaskConical, RefreshCw, Unlink } from 'lucide-react'

interface Props {
  fileName: string
  rowCount: number
  usingDemo: boolean
  onChangeData: () => void
  onDisconnect: () => void
}

export default function DataBar({ fileName, rowCount, usingDemo, onChangeData, onDisconnect }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-100 shrink-0">
      <span className={`flex h-6 w-6 items-center justify-center rounded-md ${usingDemo ? 'bg-purple-50' : 'bg-green-50'}`}>
        {usingDemo
          ? <FlaskConical size={13} className="text-purple-500" />
          : <Database size={13} className="text-green-500" />}
      </span>

      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs font-semibold text-gray-800 truncate max-w-[200px]">{fileName}</span>
        <span className="text-[10px] text-gray-400 shrink-0">{rowCount.toLocaleString()} rows</span>
        {usingDemo && (
          <span className="text-[10px] font-medium text-purple-600 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-full shrink-0">
            Demo
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={onChangeData}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw size={11} />
          Change
        </button>
        <button
          onClick={onDisconnect}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Unlink size={11} />
          Disconnect
        </button>
      </div>
    </div>
  )
}
