import { CheckCircle, Clock, FileText, MoreVertical, Trash2, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store/useStore'
import { formatFileSize } from '../../utils/fileParser'

export default function RecentUploads() {
  const { uploads, setActiveFile, openMapper, deleteUpload } = useStore()
  const [showAll, setShowAll] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('[data-menu]')) setMenuOpenId(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (uploads.length === 0) return null

  const displayed = showAll ? uploads : uploads.slice(-5).reverse()

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Recent Uploads &amp; Status
        </p>
        {uploads.length > 5 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-blue-600 hover:underline"
          >
            {showAll ? 'Show Less' : `View All (${uploads.length})`}
          </button>
        )}
      </div>
      <div className="border border-gray-200 rounded-xl bg-white overflow-visible">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 rounded-tl-xl">Filename</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Size</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-2 rounded-tr-xl" />
            </tr>
          </thead>
          <tbody>
            {displayed.map((file, idx) => {
              const isLast = idx === displayed.length - 1
              return (
                <tr
                  key={file.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    if (file.status === 'READY TO REVIEW') setActiveFile(file.id)
                    else if (file.status === 'PROCESSING' && file.headers.length > 0) openMapper(file.id)
                  }}
                >
                  <td className="px-4 py-2.5 flex items-center gap-2">
                    <FileText size={14} className="text-blue-500 shrink-0" />
                    <span className="text-gray-800 font-medium truncate max-w-[180px]">{file.name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{formatFileSize(file.size)}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={file.status} />
                  </td>
                  <td
                    className="px-4 py-2.5 relative"
                    data-menu
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                      onClick={() => setMenuOpenId(menuOpenId === file.id ? null : file.id)}
                    >
                      <MoreVertical size={14} />
                    </button>
                    {menuOpenId === file.id && (
                      <div
                        data-menu
                        className={`absolute right-2 z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 w-40 ${
                          isLast ? 'bottom-8' : 'top-8'
                        }`}
                      >
                        {file.status !== 'ERROR' && (
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                            onClick={() => {
                              setMenuOpenId(null)
                              if (file.headers.length > 0) openMapper(file.id)
                            }}
                          >
                            <FileText size={12} />
                            Re-map Columns
                          </button>
                        )}
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setMenuOpenId(null)
                            deleteUpload(file.id)
                          }}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'READY TO REVIEW') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <CheckCircle size={10} />
        Ready to Review
      </span>
    )
  }
  if (status === 'PROCESSING') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={10} className="animate-spin" />
        Processing...
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
      <XCircle size={10} />
      Error
    </span>
  )
}
