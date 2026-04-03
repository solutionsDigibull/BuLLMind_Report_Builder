import { useState } from 'react'
import type { Row, WidgetConfig } from '../../../types'
import { STANDARD_FIELD_LABELS } from '../../../utils/columnMapper'
import { exportToCsv } from '../../../utils/exportCsv'

interface Props {
  config: WidgetConfig
  data: Row[]
  selected?: boolean
  onClick?: () => void
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DELAYED: 'bg-red-100 text-red-700',
  PENDING: 'bg-amber-100 text-amber-700',
  LOW: 'bg-amber-100 text-amber-700',
}

export default function TableWidget({ config, data, selected, onClick }: Props) {
  const [page, setPage] = useState(0)
  const pageSize = 5

  const displayRows = data.length > 0 ? data : DEMO_ROWS
  const columns = data.length > 0 ? Object.keys(displayRows[0] ?? {}) : Object.keys(DEMO_ROWS[0])

  const paged = displayRows.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(displayRows.length / pageSize)

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border cursor-pointer transition-all overflow-hidden ${
        selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-700">{config.title}</p>
        <button
          className="text-xs text-blue-600 hover:underline"
          onClick={(e) => {
            e.stopPropagation()
            exportToCsv(displayRows, config.title || 'table-export')
          }}
        >
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map((col) => (
                <th key={col} className="px-4 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {STANDARD_FIELD_LABELS[col as keyof typeof STANDARD_FIELD_LABELS] ?? col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                {columns.map((col) => {
                  const val = String(row[col] ?? '')
                  const isStatus = col === 'status'
                  return (
                    <td key={col} className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                      {isStatus ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            STATUS_COLORS[val.toUpperCase()] ?? 'bg-gray-100 text-gray-600'
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-500">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, displayRows.length)} of{' '}
            {displayRows.length}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page === 0}
              onClick={(e) => { e.stopPropagation(); setPage(p => p - 1) }}
              className="px-2 py-0.5 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-white"
            >
              ‹
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={(e) => { e.stopPropagation(); setPage(p => p + 1) }}
              className="px-2 py-0.5 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-white"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const DEMO_ROWS: Row[] = [
  { finished_good: 'TX-900 Core', level: '1.0', assembly: 'Power Unit', part_number: 'P-55210', unit_cost: '$145.00', status: 'ACTIVE' },
  { finished_good: 'TX-900 Core', level: '1.1', assembly: 'Control Board', part_number: 'E-99120', unit_cost: '$89.20', status: 'DELAYED' },
  { finished_good: 'TX-900 Core', level: '1.2', assembly: 'Casing Shell', part_number: 'M-11024', unit_cost: '$42.50', status: 'ACTIVE' },
  { finished_good: 'TX-900 Core', level: '2.0', assembly: 'Fan Module', part_number: 'F-30201', unit_cost: '$28.90', status: 'ACTIVE' },
  { finished_good: 'FX-200 Lite', level: '1.0', assembly: 'PCB Main', part_number: 'P-10045', unit_cost: '$67.00', status: 'PENDING' },
]
