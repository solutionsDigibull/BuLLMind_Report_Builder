import {
  BarChart2,
  LayoutGrid,
  PieChart,
  Table,
  TrendingUp,
  Trash2,
  Type,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { ALL_STANDARD_FIELDS, STANDARD_FIELD_LABELS } from '../../utils/columnMapper'
import type { WidgetType } from '../../types'

const COLORS = [
  '#2563eb', '#7c3aed', '#0891b2', '#16a34a',
  '#d97706', '#dc2626', '#db2777', '#ea580c',
  '#64748b', '#0f172a', '#059669', '#ca8a04',
]

const TYPE_ICONS: Record<WidgetType, React.ReactNode> = {
  kpi: <LayoutGrid size={13} />,
  'bar-chart': <BarChart2 size={13} />,
  'pie-chart': <PieChart size={13} />,
  'line-chart': <TrendingUp size={13} />,
  table: <Table size={13} />,
  text: <Type size={13} />,
}

export default function PropertiesPanel() {
  const { canvasWidgets, selectedWidgetId, updateWidget, removeWidget, uploads, activeFileId } = useStore()
  const widget = canvasWidgets.find((w) => w.id === selectedWidgetId)

  // Get active data for field preview
  const activeFile = activeFileId
    ? uploads.find(u => u.id === activeFileId)
    : uploads.find(u => u.standardizedRows.length > 0)
  const sampleRow = activeFile?.standardizedRows?.[0] ?? null

  if (!widget) {
    return (
      <div className="w-60 flex flex-col h-full" style={{ background: '#fafafa', borderLeft: '1px solid #e5e7eb' }}>
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Properties</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <LayoutGrid size={18} className="text-gray-300" />
          </div>
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Click a widget on the canvas to edit its properties
          </p>
        </div>
      </div>
    )
  }

  const fieldOptions = ALL_STANDARD_FIELDS.filter(f => f !== 'ignore')

  return (
    <div className="w-60 flex flex-col h-full overflow-y-auto scrollbar-thin" style={{ background: '#fafafa', borderLeft: '1px solid #e5e7eb' }}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
          {TYPE_ICONS[widget.type]}
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-700 capitalize">{widget.type.replace('-', ' ')}</p>
          <p className="text-[10px] text-gray-400">Widget Properties</p>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-5">

        {/* Title */}
        <Section label="Title">
          <input
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={widget.title}
            onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
          />
        </Section>

        {/* Data field */}
        {widget.type !== 'text' && (
          <Section label="Data Field">
            <select
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={widget.dataField ?? ''}
              onChange={(e) => updateWidget(widget.id, { dataField: e.target.value as any || undefined })}
            >
              <option value="">— None —</option>
              {fieldOptions.map((f) => (
                <option key={f} value={f}>{STANDARD_FIELD_LABELS[f] ?? f}</option>
              ))}
            </select>
            {widget.dataField && sampleRow && sampleRow[widget.dataField] !== undefined && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400">Sample:</span>
                <span className="text-[10px] font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                  {String(sampleRow[widget.dataField])}
                </span>
              </div>
            )}
          </Section>
        )}

        {/* Group by */}
        {(widget.type === 'bar-chart' || widget.type === 'pie-chart' || widget.type === 'line-chart') && (
          <Section label="Group By">
            <select
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={widget.groupBy ?? ''}
              onChange={(e) => updateWidget(widget.id, { groupBy: e.target.value as any || undefined })}
            >
              <option value="">— None —</option>
              {fieldOptions.map((f) => (
                <option key={f} value={f}>{STANDARD_FIELD_LABELS[f] ?? f}</option>
              ))}
            </select>
          </Section>
        )}

        {/* Color */}
        {widget.type !== 'table' && widget.type !== 'text' && (
          <Section label="Color">
            <div className="grid grid-cols-6 gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => updateWidget(widget.id, { color: c })}
                  title={c}
                  className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
                    widget.color === c ? 'border-gray-800 scale-110' : 'border-transparent hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Card Style (KPI only) */}
        {widget.type === 'kpi' && (
          <Section label="Card Style">
            <div className="grid grid-cols-4 gap-1.5">
              {(['default', 'tint', 'gradient', 'bold'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateWidget(widget.id, { bgStyle: s })}
                  className={`py-2 rounded-lg border text-[10px] font-semibold capitalize transition-colors ${
                    (widget.bgStyle ?? 'default') === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-100 bg-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* Width */}
        <Section label="Width">
          <div className="flex gap-1.5">
            {([1, 2, 3] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateWidget(widget.id, { span: s })}
                className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                  widget.span === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-100 bg-white'
                }`}
              >
                {s === 1 ? '1/4' : s === 2 ? '1/2' : 'Full'}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* Delete */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => removeWidget(widget.id)}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-red-500 border border-red-100 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors bg-white"
        >
          <Trash2 size={12} />
          Remove Widget
        </button>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
