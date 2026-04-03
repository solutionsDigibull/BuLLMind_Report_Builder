import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, Eye, EyeOff, GripHorizontal, Plus, Redo2, Trash2, Undo2 } from 'lucide-react'
import Papa from 'papaparse'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SapIntegrationModal from '../sap/SapIntegrationModal'
import { useStore } from '../../store/useStore'
import type { Row, UploadedFile, WidgetConfig, WidgetType } from '../../types'
import { autoMapColumns } from '../../utils/columnMapper'
import DataBar from './DataBar'
import DataSourcePanel from './DataSourcePanel'
import BarChartWidget from './widgets/BarChartWidget'
import KPICard from './widgets/KPICard'
import LineChartWidget from './widgets/LineChartWidget'
import PieChartWidget from './widgets/PieChartWidget'
import TableWidget from './widgets/TableWidget'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const SAMPLE_ROWS: Row[] = [
  { part_number: 'FG-10001', description: 'Electronic Control Unit', quantity: 120, unit_cost: 234.50, total_cost: 28140, supplier: 'Bosch GmbH', category: 'Electronics', lead_time_days: 14, assembly: 'Main Assembly', revision: 'A', status: 'Active', weight_kg: 0.45, currency: 'EUR', notes: '' },
  { part_number: 'FG-10002', description: 'Hydraulic Pump', quantity: 60, unit_cost: 589.00, total_cost: 35340, supplier: 'Parker Hannifin', category: 'Hydraulics', lead_time_days: 21, assembly: 'Drive Unit', revision: 'B', status: 'Active', weight_kg: 3.2, currency: 'USD', notes: '' },
  { part_number: 'RM-20001', description: 'Steel Fasteners M8x30', quantity: 2400, unit_cost: 0.18, total_cost: 432, supplier: 'Würth', category: 'Fasteners', lead_time_days: 3, assembly: 'Main Assembly', revision: 'A', status: 'Active', weight_kg: 0.01, currency: 'EUR', notes: 'Bulk pack' },
  { part_number: 'RM-20002', description: 'Aluminium Bracket 6061', quantity: 300, unit_cost: 12.40, total_cost: 3720, supplier: 'Hydro ASA', category: 'Sheet Metal', lead_time_days: 7, assembly: 'Chassis', revision: 'C', status: 'Active', weight_kg: 0.22, currency: 'EUR', notes: '' },
  { part_number: 'FG-10003', description: 'Sensor Module IMU', quantity: 80, unit_cost: 145.00, total_cost: 11600, supplier: 'STMicroelectronics', category: 'Electronics', lead_time_days: 10, assembly: 'Main Assembly', revision: 'A', status: 'Active', weight_kg: 0.08, currency: 'EUR', notes: '' },
  { part_number: 'FG-10004', description: 'Bearing SKF 6205', quantity: 400, unit_cost: 8.75, total_cost: 3500, supplier: 'SKF', category: 'Bearings', lead_time_days: 5, assembly: 'Drive Unit', revision: 'A', status: 'Active', weight_kg: 0.09, currency: 'SEK', notes: '' },
  { part_number: 'RM-20003', description: 'Rubber Gasket 120mm', quantity: 500, unit_cost: 2.30, total_cost: 1150, supplier: 'Freudenberg', category: 'Seals', lead_time_days: 4, assembly: 'Hydraulics', revision: 'A', status: 'Active', weight_kg: 0.03, currency: 'EUR', notes: '' },
  { part_number: 'FG-10005', description: 'PCB Controller Board', quantity: 50, unit_cost: 320.00, total_cost: 16000, supplier: 'Jabil Circuit', category: 'Electronics', lead_time_days: 28, assembly: 'Main Assembly', revision: 'D', status: 'In Review', weight_kg: 0.15, currency: 'USD', notes: 'New revision pending' },
  { part_number: 'RM-20004', description: 'Copper Cable 2.5mm²', quantity: 1200, unit_cost: 1.85, total_cost: 2220, supplier: 'Nexans', category: 'Cables', lead_time_days: 6, assembly: 'Wiring', revision: 'A', status: 'Active', weight_kg: 0.02, currency: 'EUR', notes: 'Per meter' },
  { part_number: 'FG-10006', description: 'Valve Block Assembly', quantity: 30, unit_cost: 870.00, total_cost: 26100, supplier: 'HAWE Hydraulik', category: 'Hydraulics', lead_time_days: 35, assembly: 'Drive Unit', revision: 'B', status: 'Active', weight_kg: 4.8, currency: 'EUR', notes: '' },
  { part_number: 'RM-20005', description: 'Stainless Tube 25x2mm', quantity: 180, unit_cost: 22.00, total_cost: 3960, supplier: 'Sandvik', category: 'Tubing', lead_time_days: 8, assembly: 'Hydraulics', revision: 'A', status: 'Active', weight_kg: 1.1, currency: 'SEK', notes: 'Per metre' },
  { part_number: 'FG-10007', description: 'Display Panel 7"', quantity: 40, unit_cost: 195.00, total_cost: 7800, supplier: 'Winstar', category: 'Electronics', lead_time_days: 18, assembly: 'HMI', revision: 'A', status: 'Active', weight_kg: 0.35, currency: 'USD', notes: '' },
  { part_number: 'RM-20006', description: 'O-Ring 80x3 NBR', quantity: 2000, unit_cost: 0.45, total_cost: 900, supplier: 'Freudenberg', category: 'Seals', lead_time_days: 3, assembly: 'Hydraulics', revision: 'A', status: 'Active', weight_kg: 0.005, currency: 'EUR', notes: '' },
  { part_number: 'FG-10008', description: 'Motor Controller 48V', quantity: 25, unit_cost: 680.00, total_cost: 17000, supplier: 'Maxon Motor', category: 'Electronics', lead_time_days: 42, assembly: 'Drive Unit', revision: 'C', status: 'Active', weight_kg: 1.2, currency: 'CHF', notes: 'Long lead time' },
  { part_number: 'RM-20007', description: 'Hex Bolt M12x50 Grade 10.9', quantity: 800, unit_cost: 0.55, total_cost: 440, supplier: 'Würth', category: 'Fasteners', lead_time_days: 3, assembly: 'Chassis', revision: 'A', status: 'Active', weight_kg: 0.02, currency: 'EUR', notes: '' },
  { part_number: 'FG-10009', description: 'Pressure Sensor 250 bar', quantity: 70, unit_cost: 112.00, total_cost: 7840, supplier: 'Kistler', category: 'Sensors', lead_time_days: 12, assembly: 'Hydraulics', revision: 'B', status: 'Active', weight_kg: 0.12, currency: 'CHF', notes: '' },
  { part_number: 'RM-20008', description: 'Epoxy Adhesive 50ml', quantity: 150, unit_cost: 18.90, total_cost: 2835, supplier: '3M', category: 'Consumables', lead_time_days: 2, assembly: 'Main Assembly', revision: 'A', status: 'Active', weight_kg: 0.06, currency: 'USD', notes: '' },
  { part_number: 'FG-10010', description: 'Gearbox Planetary 5:1', quantity: 20, unit_cost: 1240.00, total_cost: 24800, supplier: 'Apex Dynamics', category: 'Gearboxes', lead_time_days: 30, assembly: 'Drive Unit', revision: 'A', status: 'Active', weight_kg: 6.5, currency: 'USD', notes: '' },
  { part_number: 'RM-20009', description: 'Heat Shrink Tubing 6mm', quantity: 5000, unit_cost: 0.08, total_cost: 400, supplier: 'TE Connectivity', category: 'Cables', lead_time_days: 2, assembly: 'Wiring', revision: 'A', status: 'Active', weight_kg: 0.001, currency: 'USD', notes: 'Per 10cm piece' },
  { part_number: 'FG-10011', description: 'Fan Assembly 120mm', quantity: 90, unit_cost: 34.00, total_cost: 3060, supplier: 'Ebm-papst', category: 'Cooling', lead_time_days: 7, assembly: 'Enclosure', revision: 'A', status: 'Active', weight_kg: 0.18, currency: 'EUR', notes: '' },
  { part_number: 'RM-20010', description: 'Polycarbonate Sheet 3mm', quantity: 60, unit_cost: 45.00, total_cost: 2700, supplier: 'Covestro', category: 'Plastics', lead_time_days: 5, assembly: 'HMI', revision: 'A', status: 'Active', weight_kg: 0.55, currency: 'EUR', notes: 'Per A2 sheet' },
  { part_number: 'FG-10012', description: 'Wireless Module BLE 5.0', quantity: 100, unit_cost: 22.50, total_cost: 2250, supplier: 'Nordic Semi', category: 'Electronics', lead_time_days: 9, assembly: 'Main Assembly', revision: 'B', status: 'Active', weight_kg: 0.005, currency: 'USD', notes: '' },
  { part_number: 'RM-20011', description: 'Mounting Rail DIN 35mm', quantity: 120, unit_cost: 3.80, total_cost: 456, supplier: 'Rittal', category: 'Enclosure Parts', lead_time_days: 4, assembly: 'Enclosure', revision: 'A', status: 'Active', weight_kg: 0.35, currency: 'EUR', notes: 'Per 1m length' },
  { part_number: 'FG-10013', description: 'Battery Pack LiFePO4 48V', quantity: 15, unit_cost: 2800.00, total_cost: 42000, supplier: 'CATL', category: 'Power', lead_time_days: 60, assembly: 'Power Unit', revision: 'A', status: 'In Review', weight_kg: 18.0, currency: 'CNY', notes: 'Critical path item' },
  { part_number: 'RM-20012', description: 'Cable Tie 200x4.8mm', quantity: 10000, unit_cost: 0.04, total_cost: 400, supplier: 'HellermannTyton', category: 'Fasteners', lead_time_days: 2, assembly: 'Wiring', revision: 'A', status: 'Active', weight_kg: 0.002, currency: 'EUR', notes: '' },
  { part_number: 'FG-10014', description: 'Encoder 1024 PPR', quantity: 35, unit_cost: 78.00, total_cost: 2730, supplier: 'Heidenhain', category: 'Sensors', lead_time_days: 14, assembly: 'Drive Unit', revision: 'A', status: 'Active', weight_kg: 0.09, currency: 'EUR', notes: '' },
  { part_number: 'RM-20013', description: 'Thermal Paste 1g', quantity: 200, unit_cost: 2.10, total_cost: 420, supplier: 'Arctic', category: 'Consumables', lead_time_days: 2, assembly: 'Electronics', revision: 'A', status: 'Active', weight_kg: 0.001, currency: 'EUR', notes: '' },
  { part_number: 'FG-10015', description: 'Emergency Stop Button', quantity: 45, unit_cost: 28.00, total_cost: 1260, supplier: 'Schneider Electric', category: 'Safety', lead_time_days: 5, assembly: 'HMI', revision: 'A', status: 'Active', weight_kg: 0.08, currency: 'EUR', notes: '' },
  { part_number: 'RM-20014', description: 'Lubricant Grease 400ml', quantity: 80, unit_cost: 14.50, total_cost: 1160, supplier: 'Klüber', category: 'Consumables', lead_time_days: 3, assembly: 'Drive Unit', revision: 'A', status: 'Active', weight_kg: 0.42, currency: 'EUR', notes: '' },
  { part_number: 'FG-10016', description: 'Power Supply 24V 10A', quantity: 55, unit_cost: 95.00, total_cost: 5225, supplier: 'Mean Well', category: 'Power', lead_time_days: 8, assembly: 'Enclosure', revision: 'B', status: 'Active', weight_kg: 0.65, currency: 'USD', notes: '' },
]

function renderWidget(config: WidgetConfig, data: Row[], selected?: boolean, onClick?: () => void) {
  const props = { config, data, selected, onClick }
  switch (config.type) {
    case 'kpi': return <KPICard {...props} />
    case 'bar-chart': return <BarChartWidget {...props} />
    case 'pie-chart': return <PieChartWidget {...props} />
    case 'line-chart': return <LineChartWidget {...props} />
    case 'table': return <TableWidget {...props} />
    case 'text': return (
      <div
        onClick={onClick}
        className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
          selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <p className="text-sm text-gray-600">{config.title}</p>
      </div>
    )
    default: return null
  }
}

export default function Canvas() {
  const {
    canvasWidgets,
    selectedWidgetId,
    selectWidget,
    addWidget,
    reorderWidgets,
    addUpload,
    openMapper,
    updateUpload,
    undo,
    redo,
    _history,
    _future,
  } = useStore()

  const [previewMode, setPreviewMode] = useState(false)

  const { uploads, activeFileId } = useStore((s) => ({ uploads: s.uploads, activeFileId: s.activeFileId }))
  const activeFile = activeFileId ? uploads.find((u) => u.id === activeFileId) : null
  const readyFile = activeFile ?? uploads.find((u) => u.standardizedRows.length > 0)
  const storeData = readyFile?.standardizedRows ?? []

  const [useSampleData, setUseSampleData] = useState(false)
  const [disconnected, setDisconnected] = useState(false)
  const [sapOpen, setSapOpen] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // When a new file is mapped and becomes active, clear any disconnected/demo state
  const prevActiveFileIdRef = useRef(activeFileId)
  useEffect(() => {
    if (activeFileId && activeFileId !== prevActiveFileIdRef.current) {
      prevActiveFileIdRef.current = activeFileId
      setDisconnected(false)
      setUseSampleData(false)
    }
  }, [activeFileId])

  const data: Row[] = !disconnected && storeData.length > 0 ? storeData
                    : !disconnected && useSampleData ? SAMPLE_ROWS
                    : []
  const hasData = data.length > 0

  const activeFileName = !disconnected && storeData.length > 0
    ? (readyFile?.name ?? 'Uploaded file')
    : useSampleData && !disconnected
    ? 'Sample BOM Data'
    : ''

  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e

    if (String(active.id).startsWith('palette-') && over) {
      const widgetType = active.data.current?.widgetType as WidgetType
      const newWidget: WidgetConfig = {
        id: genId(),
        type: widgetType,
        title: widgetType === 'kpi'
          ? 'Total Items'
          : widgetType === 'bar-chart'
          ? 'Quantity by Category'
          : widgetType === 'pie-chart'
          ? 'Cost Breakdown'
          : widgetType === 'line-chart'
          ? 'Trend Over Time'
          : widgetType === 'table'
          ? 'Data Table'
          : 'Text Block',
        order: canvasWidgets.length,
        span: widgetType === 'table' ? 3 : widgetType === 'kpi' ? 1 : 2,
        color: '#2563eb',
      }
      addWidget(newWidget)
      selectWidget(newWidget.id)
      return
    }

    if (active.id !== over?.id) {
      const oldIndex = canvasWidgets.findIndex((w) => w.id === active.id)
      const newIndex = canvasWidgets.findIndex((w) => w.id === over?.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderWidgets(arrayMove(canvasWidgets, oldIndex, newIndex))
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsParsing(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? []
        const rows = results.data as Row[]
        const mappings = autoMapColumns(headers)
        const id = genId()
        const upload: UploadedFile = {
          id,
          name: file.name,
          size: file.size,
          status: 'PROCESSING',
          headers,
          rows,
          mappings,
          standardizedRows: [],
          uploadedAt: new Date(),
        }
        addUpload(upload)
        setDisconnected(false)
        setUseSampleData(false)
        openMapper(id)
        setIsParsing(false)
      },
      error() {
        setIsParsing(false)
      },
    })
    e.target.value = ''
  }

  function handleUseSample() {
    setUseSampleData(true)
    setDisconnected(false)
  }

  function handleDisconnect() {
    setDisconnected(true)
    setUseSampleData(false)
  }

  function handleChangeData() {
    setDisconnected(true)
    setUseSampleData(false)
  }

  const activeWidget = canvasWidgets.find((w) => w.id === activeId)

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {sapOpen && (
        <SapIntegrationModal mode="reports" onClose={() => setSapOpen(false)} />
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex flex-col overflow-hidden">
          {hasData && (
            <div className="no-print">
              <DataBar
                fileName={activeFileName}
                rowCount={data.length}
                usingDemo={useSampleData && storeData.length === 0}
                onChangeData={handleChangeData}
                onDisconnect={handleDisconnect}
              />
            </div>
          )}

          {/* Toolbar: undo/redo + preview toggle */}
          {canvasWidgets.length > 0 && (
            <div className="no-print flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-white shrink-0">
              <button
                onClick={undo}
                disabled={_history.length === 0}
                title="Undo (Ctrl+Z)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Undo2 size={13} /> Undo
              </button>
              <button
                onClick={redo}
                disabled={_future.length === 0}
                title="Redo (Ctrl+Y)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Redo2 size={13} /> Redo
              </button>
              <div className="ml-auto">
                <button
                  onClick={() => { setPreviewMode(v => !v); selectWidget(null) }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
                    previewMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {previewMode ? <><EyeOff size={13} /> Exit Preview</> : <><Eye size={13} /> Preview</>}
                </button>
              </div>
            </div>
          )}

          <div
            className="flex-1 p-6 overflow-auto min-h-full canvas-print-area"
            style={!previewMode ? {
              backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              backgroundColor: '#f8fafc',
            } : { backgroundColor: '#ffffff' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) selectWidget(null)
            }}
          >
            {canvasWidgets.length === 0 ? (
              <EmptyCanvas />
            ) : (
              <>
                {!hasData && !previewMode && (
                  <DataSourcePanel
                    onConnectSap={() => setSapOpen(true)}
                    onUseSample={handleUseSample}
                    fileInputRef={fileInputRef}
                    isParsing={isParsing}
                  />
                )}
                <SortableContext items={canvasWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-12 gap-6 auto-rows-auto">
                    {canvasWidgets.map((widget) => (
                      <SortableWidget
                        key={widget.id}
                        widget={widget}
                        data={data}
                        selected={!previewMode && selectedWidgetId === widget.id}
                        onSelect={() => !previewMode && selectWidget(widget.id)}
                        previewMode={previewMode}
                      />
                    ))}
                  </div>
                </SortableContext>
              </>
            )}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeWidget && (
            <div className="opacity-75 pointer-events-none rotate-1 scale-105 shadow-2xl">
              {renderWidget(activeWidget, data)}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  )
}

function SortableWidget({
  widget,
  data,
  selected,
  onSelect,
  previewMode,
}: {
  widget: WidgetConfig
  data: Row[]
  selected: boolean
  onSelect: () => void
  previewMode: boolean
}) {
  const { removeWidget, duplicateWidget } = useStore()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: previewMode,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${(widget.span ?? 1) * 3}`,
  }

  return (
    <div ref={setNodeRef} style={style} className={`flex flex-col group ${isDragging ? 'opacity-20 scale-95' : ''}`}>
      {!previewMode && (
        <div
          className="flex items-center justify-between px-2 mb-1 h-7 rounded-lg select-none transition-all"
          style={{ background: selected ? 'rgba(79,142,247,0.08)' : 'transparent' }}
          onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(100,116,139,0.06)' }}
          onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: '#94a3b8' }}>
            {widget.type.replace('-', ' ')}
          </span>
          <div
            {...attributes}
            {...listeners}
            className="flex items-center gap-1 px-3 py-1 rounded-md cursor-grab active:cursor-grabbing transition-all opacity-40 group-hover:opacity-100"
            style={{ touchAction: 'none' }}
            title="Drag to reorder"
          >
            <GripHorizontal size={14} style={{ color: '#64748b' }} />
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); duplicateWidget(widget.id) }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-blue-50"
              title="Duplicate widget"
            >
              <Copy size={11} style={{ color: '#cbd5e1' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
                onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
              />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); removeWidget(widget.id) }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
              title="Remove widget"
            >
              <Trash2 size={11} style={{ color: '#cbd5e1' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
              />
            </button>
          </div>
        </div>
      )}
      {renderWidget(widget, data, selected, onSelect)}
    </div>
  )
}

function EmptyCanvas() {
  const navigate = useNavigate()
  const hasData = useStore((s) => s.uploads.some((u) => u.standardizedRows.length > 0))

  return (
    <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-200 rounded-2xl text-center p-8">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <Plus size={24} className="text-blue-400" />
      </div>
      <p className="text-gray-700 font-medium mb-1">Start building your report</p>
      <p className="text-sm text-gray-400 mb-4">Drag widgets from the left panel onto this canvas</p>
      {!hasData && (
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Upload data first
        </button>
      )}
    </div>
  )
}
