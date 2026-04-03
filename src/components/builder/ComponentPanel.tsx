import { useDraggable } from '@dnd-kit/core'
import { Database, History, Layers } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../../store/useStore'
import type { WidgetType } from '../../types'

interface PaletteItem {
  type: WidgetType
  label: string
  description: string
  preview: React.ReactNode
}

// Mini SVG previews for each widget type
function KpiPreview() {
  return (
    <div className="w-full h-full flex flex-col justify-between p-1.5">
      <div className="h-1.5 w-8 bg-blue-200 rounded" />
      <div className="h-4 w-12 bg-blue-500 rounded" />
      <div className="flex items-center gap-1">
        <div className="h-1 w-1 bg-green-400 rounded-full" />
        <div className="h-1 w-5 bg-green-200 rounded" />
      </div>
    </div>
  )
}

function BarPreview() {
  const heights = [40, 70, 55, 85, 45]
  return (
    <div className="w-full h-full flex items-end justify-around px-1 pb-1 gap-0.5">
      {heights.map((h, i) => (
        <div key={i} className="flex-1 bg-blue-400 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

function PiePreview() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 36 36" className="w-8 h-8">
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="60, 40" />
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#7c3aed" strokeWidth="4" strokeDasharray="25, 75" strokeDashoffset="-60" />
      </svg>
    </div>
  )
}

function LinePreview() {
  return (
    <div className="w-full h-full flex items-center justify-center px-1 pb-1">
      <svg viewBox="0 0 50 24" className="w-full h-full">
        <polyline points="2,18 10,12 20,15 30,6 40,10 48,4" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="2,18 10,12 20,15 30,6 40,10 48,4" fill="url(#grad)" stroke="none" opacity="0.15" />
      </svg>
    </div>
  )
}

function TablePreview() {
  return (
    <div className="w-full h-full flex flex-col gap-1 p-1.5">
      <div className="h-1.5 bg-gray-300 rounded w-full" />
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-1">
          <div className="h-1 bg-gray-200 rounded flex-1" />
          <div className="h-1 bg-gray-200 rounded flex-1" />
          <div className="h-1 bg-gray-200 rounded w-4" />
        </div>
      ))}
    </div>
  )
}

function TextPreview() {
  return (
    <div className="w-full h-full flex flex-col gap-1 p-1.5 justify-center">
      <div className="h-2 bg-gray-400 rounded w-6" />
      <div className="h-1 bg-gray-200 rounded w-full" />
      <div className="h-1 bg-gray-200 rounded w-4/5" />
    </div>
  )
}

const PALETTE: PaletteItem[] = [
  { type: 'kpi', label: 'KPI Card', description: 'Single metric with trend', preview: <KpiPreview /> },
  { type: 'bar-chart', label: 'Bar Chart', description: 'Compare categories', preview: <BarPreview /> },
  { type: 'pie-chart', label: 'Pie Chart', description: 'Distribution view', preview: <PiePreview /> },
  { type: 'line-chart', label: 'Line Chart', description: 'Trend over time', preview: <LinePreview /> },
  { type: 'table', label: 'Data Table', description: 'Tabular data view', preview: <TablePreview /> },
  { type: 'text', label: 'Text Block', description: 'Labels and notes', preview: <TextPreview /> },
]

type PanelTab = 'Components' | 'Data' | 'History'

export default function ComponentPanel() {
  const [activeTab, setActiveTab] = useState<PanelTab>('Components')
  const { addWidget, canvasWidgets, uploads } = useStore()

  const PANEL_TABS: { label: PanelTab; icon: React.ReactNode }[] = [
    { label: 'Components', icon: <Layers size={13} /> },
    { label: 'Data', icon: <Database size={13} /> },
    { label: 'History', icon: <History size={13} /> },
  ]

  const handleAddWidget = (type: WidgetType) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const labels: Record<WidgetType, string> = {
      kpi: 'KPI Card', 'bar-chart': 'Bar Chart', 'pie-chart': 'Pie Chart',
      'line-chart': 'Line Chart', table: 'Data Table', text: 'Text Block',
    }
    addWidget({
      id, type, title: labels[type],
      order: canvasWidgets.length,
      span: type === 'table' ? 3 : type === 'kpi' ? 1 : 2,
      color: '#2563eb',
    })
  }

  return (
    <div className="w-52 flex flex-col h-full" style={{ background: '#fafafa', borderRight: '1px solid #e5e7eb', borderLeft: '3px solid rgba(79,142,247,0.18)' }}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {PANEL_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-semibold border-b-2 transition-colors ${
              activeTab === tab.label
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Components tab */}
      {activeTab === 'Components' && (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">
            Drag or click to add
          </p>
          {PALETTE.map((item) => (
            <DraggablePaletteItem key={item.type} item={item} onAdd={() => handleAddWidget(item.type)} />
          ))}
        </div>
      )}

      {/* Data tab */}
      {activeTab === 'Data' && (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">
            Uploaded Files
          </p>
          {uploads.length === 0 ? (
            <div className="text-center py-6">
              <Database size={20} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No files uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {uploads.map((u) => (
                <div key={u.id} className={`p-2.5 rounded-lg border text-xs ${
                  u.standardizedRows.length > 0
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}>
                  <p className="font-semibold text-gray-800 truncate">{u.name}</p>
                  <p className="text-gray-500 mt-0.5 text-[10px]">
                    {u.rows.length} rows · {u.standardizedRows.length > 0 ? '✓ Mapped' : u.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History tab */}
      {activeTab === 'History' && (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">
            Canvas Widgets
          </p>
          {canvasWidgets.length === 0 ? (
            <div className="text-center py-6">
              <Layers size={20} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No widgets on canvas</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {canvasWidgets.map((w) => (
                <div key={w.id} className="p-2.5 rounded-lg border border-gray-200 bg-white text-xs flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{w.title}</p>
                    <p className="text-gray-400 capitalize text-[10px]">{w.type.replace('-', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add KPI button */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => handleAddWidget('kpi')}
          className="w-full py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 bg-white"
        >
          + Add KPI Card
        </button>
      </div>
    </div>
  )
}

function DraggablePaletteItem({ item, onAdd }: { item: PaletteItem; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { widgetType: item.type },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onAdd}
      className={`flex items-center gap-3 p-2.5 rounded-xl border bg-white cursor-grab active:cursor-grabbing transition-all select-none group ${
        isDragging
          ? 'opacity-40 scale-95'
          : 'border-gray-100 hover:border-blue-200 hover:shadow-sm hover:bg-blue-50/20'
      }`}
    >
      {/* Mini preview */}
      <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0 group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-colors">
        {item.preview}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-800">{item.label}</p>
        <p className="text-[10px] text-gray-400 truncate">{item.description}</p>
      </div>
    </div>
  )
}
