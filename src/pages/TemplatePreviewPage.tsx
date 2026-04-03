import {
  ArrowLeft, BarChart2, Hash, PieChart as PieIcon,
  Star, Table as TableIcon, Tag, Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useStore } from '../store/useStore'
import { CATEGORY_META, TEMPLATES } from './Templates'

// ─── Per-category sample data ─────────────────────────────────────────────────

const KPI_SAMPLES: Record<string, { value: string; sub: string }> = {
  quantity:      { value: '1,240',   sub: 'units'       },
  total_cost:    { value: '$48.3K',  sub: 'total value' },
  unit_cost:     { value: '$12.80',  sub: 'per unit'    },
  status:        { value: '94.2%',   sub: 'pass rate'   },
  lead_time:     { value: '8.4',     sub: 'avg days'    },
  part_number:   { value: '347',     sub: 'parts'       },
  finished_good: { value: '24',      sub: 'finished goods' },
  assembly:      { value: '48',      sub: 'sub-assemblies' },
  level:         { value: '3',       sub: 'BOM levels'  },
  supplier:      { value: '18',      sub: 'vendors'     },
  manufacturer:  { value: '12',      sub: 'makers'      },
  mpn:           { value: '247',     sub: 'MPNs'        },
  category:      { value: '8',       sub: 'categories'  },
}

interface ChartSet { bar: { name: string; value: number }[]; pie: { name: string; value: number }[] }

const CHART_DATA: Record<string, ChartSet> = {
  PRODUCTION: {
    bar: [
      { name: 'Line A', value: 450 },
      { name: 'Line B', value: 380 },
      { name: 'Line C', value: 520 },
      { name: 'Line D', value: 290 },
      { name: 'Line E', value: 415 },
    ],
    pie: [
      { name: 'Good',   value: 78 },
      { name: 'Rework', value: 14 },
      { name: 'Reject', value: 8  },
    ],
  },
  FINANCE: {
    bar: [
      { name: 'Q1', value: 120000 },
      { name: 'Q2', value: 98000  },
      { name: 'Q3', value: 145000 },
      { name: 'Q4', value: 132000 },
    ],
    pie: [
      { name: 'Labor',     value: 40 },
      { name: 'Materials', value: 35 },
      { name: 'Overhead',  value: 15 },
      { name: 'Other',     value: 10 },
    ],
  },
  INVENTORY: {
    bar: [
      { name: 'Electronics', value: 320  },
      { name: 'Mechanical',  value: 480  },
      { name: 'Fasteners',   value: 1200 },
      { name: 'Assemblies',  value: 95   },
    ],
    pie: [
      { name: 'In Stock',     value: 68 },
      { name: 'Low Stock',    value: 22 },
      { name: 'Out of Stock', value: 10 },
    ],
  },
  PURCHASING: {
    bar: [
      { name: 'Rutronik',  value: 28000 },
      { name: 'STG Elec.', value: 19500 },
      { name: 'Arrow',     value: 34200 },
      { name: 'Digi-Key',  value: 12800 },
    ],
    pie: [
      { name: 'On Time',   value: 72 },
      { name: 'Delayed',   value: 20 },
      { name: 'Cancelled', value: 8  },
    ],
  },
  QUALITY: {
    bar: [
      { name: 'MCU Board',   value: 12 },
      { name: 'Charger PCB', value: 8  },
      { name: 'Battery Mod', value: 24 },
      { name: 'Display',     value: 5  },
    ],
    pie: [
      { name: 'Pass',   value: 85 },
      { name: 'Rework', value: 10 },
      { name: 'Reject', value: 5  },
    ],
  },
  BOM: {
    bar: [
      { name: 'L0 – FG',   value: 12  },
      { name: 'L1 – Assy', value: 48  },
      { name: 'L2 – Sub',  value: 124 },
      { name: 'L3 – Raw',  value: 287 },
    ],
    pie: [
      { name: 'Purchased', value: 62 },
      { name: 'Make',      value: 28 },
      { name: 'Phantom',   value: 10 },
    ],
  },
}

interface TableSet { headers: string[]; rows: string[][] }

const TABLE_DATA: Record<string, TableSet> = {
  PRODUCTION: {
    headers: ['Part Number', 'Description', 'Qty Produced', 'Status', 'Efficiency'],
    rows: [
      ['EV-MB-001', 'Main Control Board',       '450', 'Good',   '94.2%'],
      ['EV-CS-002', 'Charging Station PCB',     '380', 'Good',   '89.1%'],
      ['EV-BT-003', 'Battery Management Module','290', 'Rework', '76.4%'],
      ['EV-DS-004', 'Display Interface Unit',   '520', 'Good',   '96.8%'],
      ['EV-PS-005', 'Power Supply Unit',        '310', 'Reject', '82.3%'],
    ],
  },
  FINANCE: {
    headers: ['Category', 'Budget', 'Actual', 'Variance', 'Status'],
    rows: [
      ['Materials', '$120,000', '$118,400', '−$1,600', 'On Budget'    ],
      ['Labor',     '$85,000',  '$89,200',  '+$4,200', 'Over Budget'  ],
      ['Overhead',  '$42,000',  '$39,800',  '−$2,200', 'Under Budget' ],
      ['Logistics', '$18,500',  '$21,300',  '+$2,800', 'Over Budget'  ],
      ['R&D',       '$30,000',  '$28,750',  '−$1,250', 'On Budget'    ],
    ],
  },
  INVENTORY: {
    headers: ['SKU', 'Description', 'On Hand', 'Location', 'Status'],
    rows: [
      ['CAP-100NF', 'Capacitor 100nF 50V',  '4,800',  'WH-A1-03', 'In Stock'  ],
      ['RES-10K',   'Resistor 10kΩ 1/4W',   '12,400', 'WH-A1-07', 'In Stock'  ],
      ['IC-ESP32',  'ESP32 Module',          '340',    'WH-B2-02', 'Low Stock' ],
      ['BOLT-M3x8', 'M3×8 Hex Bolt',        '8,200',  'WH-C1-01', 'In Stock'  ],
      ['PCB-V1.2',  'Main PCB Blank V1.2',  '48',     'WH-B1-05', 'Low Stock' ],
    ],
  },
  PURCHASING: {
    headers: ['PO Number', 'Supplier', 'Amount', 'Lead Time', 'Status'],
    rows: [
      ['PO-2026-0412', 'Rutronik Electronics', '$28,400', '14 days', 'Confirmed'],
      ['PO-2026-0408', 'STG Electronics',      '$19,200', '21 days', 'Pending'  ],
      ['PO-2026-0401', 'Arrow Components',     '$34,100', '7 days',  'Shipped'  ],
      ['PO-2026-0395', 'Digi-Key',             '$12,600', '3 days',  'Delivered'],
      ['PO-2026-0388', 'Mouser Electronics',   '$22,800', '10 days', 'Confirmed'],
    ],
  },
  QUALITY: {
    headers: ['Batch ID', 'Product', 'Inspected', 'Passed', 'Defect Rate'],
    rows: [
      ['B-2026-0412', 'EV MCU Board',      '250', '238', '4.8%'],
      ['B-2026-0408', 'Charging PCB',      '180', '174', '3.3%'],
      ['B-2026-0401', 'Battery Module',    '120', '109', '9.2%'],
      ['B-2026-0395', 'Display Interface', '200', '198', '1.0%'],
      ['B-2026-0388', 'Power Supply Unit', '160', '148', '7.5%'],
    ],
  },
  BOM: {
    headers: ['Part Number', 'Description', 'Level', 'Qty', 'Unit Cost'],
    rows: [
      ['EV_MCU_MB',         'EV MCU Main Board',    '0', '1',  '$48.50'],
      ['MB_PCBA',           'Main PCBA Assembly',   '1', '1',  '$32.80'],
      ['AC0603KRX7R9BB104', 'Capacitor 100nF 50V',  '2', '12', '$0.05' ],
      ['GRT188R61C106KE13D','Capacitor 10uF 16V',   '2', '8',  '$0.12' ],
      ['MB_PCB_V1.2',       'Main PCB Blank V1.2',  '2', '1',  '$8.40' ],
    ],
  },
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']

const STATUS_STYLES: Record<string, string> = {
  'Good':         'bg-emerald-50 text-emerald-700',
  'In Stock':     'bg-emerald-50 text-emerald-700',
  'On Time':      'bg-emerald-50 text-emerald-700',
  'Confirmed':    'bg-emerald-50 text-emerald-700',
  'Delivered':    'bg-emerald-50 text-emerald-700',
  'Pass':         'bg-emerald-50 text-emerald-700',
  'On Budget':    'bg-emerald-50 text-emerald-700',
  'Rework':       'bg-amber-50  text-amber-700',
  'Low Stock':    'bg-amber-50  text-amber-700',
  'Delayed':      'bg-amber-50  text-amber-700',
  'Pending':      'bg-amber-50  text-amber-700',
  'Over Budget':  'bg-amber-50  text-amber-700',
  'Reject':       'bg-red-50    text-red-700',
  'Out of Stock': 'bg-red-50    text-red-700',
  'Cancelled':    'bg-red-50    text-red-700',
  'Under Budget': 'bg-blue-50   text-blue-700',
  'Shipped':      'bg-blue-50   text-blue-700',
}

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────

function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TemplatePreviewPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const { favoriteTemplates, toggleFavorite, loadTemplate, showToast } = useStore()
  const [loading, setLoading] = useState(true)

  // Simulate brief load so skeleton is visible on navigation
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 380)
    return () => clearTimeout(t)
  }, [templateId])

  const template = TEMPLATES.find(t => t.id === templateId)

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
        <p className="text-sm font-semibold">Template not found.</p>
        <button
          onClick={() => navigate('/templates')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft size={13} /> Back to Gallery
        </button>
      </div>
    )
  }

  const meta       = CATEGORY_META[template.category] ?? CATEGORY_META.PRODUCTION
  const kpiWidgets = template.widgets.filter(w => w.type === 'kpi').slice(0, 4)
  const barTitle   = template.widgets.find(w => w.type === 'bar-chart')?.title  ?? 'Distribution'
  const pieTitle   = template.widgets.find(w => w.type === 'pie-chart')?.title  ?? 'Breakdown'
  const tableTitle = template.widgets.find(w => w.type === 'table')?.title      ?? 'Sample Data'
  const chartData  = CHART_DATA[template.category]  ?? CHART_DATA.PRODUCTION
  const tableData  = TABLE_DATA[template.category]  ?? TABLE_DATA.PRODUCTION
  const isFav      = favoriteTemplates.has(template.id)

  const handleUse = () => {
    loadTemplate(template.widgets, template.name)
    showToast(`"${template.name}" loaded into Builder`, 'success')
    navigate('/builder')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/40">

      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-100"
        style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}
      >
        {/* Left: back + name */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/templates')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors shrink-0"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="w-px h-5 bg-gray-200 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-slate-900 leading-tight">{template.name}</h1>
              <span
                className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0"
                style={{ background: meta.bg, color: meta.color }}
              >
                {meta.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xl">{template.description}</p>
          </div>
        </div>

        {/* Right: fav + use */}
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button
            onClick={() => toggleFavorite(template.id)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              size={15}
              fill={isFav ? 'currentColor' : 'none'}
              className={isFav ? 'text-amber-400' : 'text-gray-400'}
            />
          </button>
          <button
            onClick={handleUse}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}dd)` }}
          >
            <Zap size={14} /> Use Template
          </button>
        </div>
      </div>

      {/* ── Scrollable body ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">

        {/* ── KPI Cards ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-4 gap-4">
            {[0,1,2,3].map(i => <Sk key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {kpiWidgets.map(w => {
              const sample = KPI_SAMPLES[w.dataField ?? 'quantity'] ?? { value: '—', sub: '' }
              return (
                <div
                  key={w.id}
                  className="bg-white rounded-xl p-4 border border-gray-100"
                  style={{ boxShadow: '0 1px 4px rgba(30,60,120,0.06)' }}
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 truncate">
                    {w.title}
                  </p>
                  <p className="text-2xl font-bold tabular-nums" style={{ color: meta.color }}>
                    {sample.value}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">{sample.sub}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Charts ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-5">
            <Sk className="h-56" />
            <Sk className="h-56" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">

            {/* Bar chart */}
            <div
              className="bg-white rounded-xl p-5 border border-gray-100"
              style={{ boxShadow: '0 1px 4px rgba(30,60,120,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: meta.bg }}
                >
                  <BarChart2 size={14} style={{ color: meta.color }} />
                </div>
                <p className="text-xs font-semibold text-slate-700">{barTitle}</p>
                <span className="ml-auto text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-slate-400">
                  Sample data
                </span>
              </div>
              <ResponsiveContainer width="100%" height={185}>
                <BarChart data={chartData.bar} margin={{ left: -10, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={38}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="value" fill={meta.color} radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Donut chart */}
            <div
              className="bg-white rounded-xl p-5 border border-gray-100"
              style={{ boxShadow: '0 1px 4px rgba(30,60,120,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: meta.bg }}
                >
                  <PieIcon size={14} style={{ color: meta.color }} />
                </div>
                <p className="text-xs font-semibold text-slate-700">{pieTitle}</p>
                <span className="ml-auto text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-slate-400">
                  Sample data
                </span>
              </div>
              <ResponsiveContainer width="100%" height={185}>
                <PieChart>
                  <Pie
                    data={chartData.pie}
                    cx="50%"
                    cy="48%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.pie.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={(v: number) => `${v}%`}
                  />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Sample Table ────────────────────────────────────────────── */}
        {loading ? (
          <Sk className="h-48" />
        ) : (
          <div
            className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(30,60,120,0.06)' }}
          >
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: meta.bg }}>
                <TableIcon size={12} style={{ color: meta.color }} />
              </div>
              <p className="text-xs font-semibold text-slate-700">{tableTitle}</p>
              <span className="ml-auto text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-slate-400">
                5 sample rows
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {tableData.headers.map(h => (
                      <th
                        key={h}
                        className="sticky top-0 z-10 px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-gray-50 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row, i) => (
                    <tr key={i} className="border-t border-gray-50 hover:bg-slate-50 transition-colors">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                          {j === row.length - 1 && STATUS_STYLES[cell] ? (
                            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[cell]}`}>
                              {cell}
                            </span>
                          ) : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Widget summary + Tags ───────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            <Sk className="h-28" />
            <Sk className="h-28" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div
              className="bg-white rounded-xl p-4 border border-gray-100"
              style={{ boxShadow: '0 1px 4px rgba(30,60,120,0.06)' }}
            >
              <div className="flex items-center gap-1.5 mb-3">
                <Hash size={12} className="text-slate-400" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Included Widgets ({template.widgets.length})
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {template.widgets.map(w => (
                  <span
                    key={w.id}
                    className="text-[10px] font-medium px-2 py-1 rounded-lg border border-gray-100 text-slate-600 whitespace-nowrap"
                  >
                    {w.type === 'kpi'        ? '▪'
                     : w.type === 'bar-chart' ? '▬'
                     : w.type === 'pie-chart' ? '◉'
                     : w.type === 'line-chart'? '∿'
                     : '☰'}{' '}
                    {w.title}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="bg-white rounded-xl p-4 border border-gray-100"
              style={{ boxShadow: '0 1px 4px rgba(30,60,120,0.06)' }}
            >
              <div className="flex items-center gap-1.5 mb-3">
                <Tag size={12} className="text-slate-400" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tags</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {template.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-1 rounded-lg border border-gray-200 text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom CTA ─────────────────────────────────────────────── */}
        <div className="flex gap-3 pb-1">
          <button
            onClick={() => navigate('/templates')}
            className="flex items-center justify-center gap-1.5 flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-slate-600 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Gallery
          </button>
          <button
            onClick={handleUse}
            className="flex items-center justify-center gap-2 flex-[2] py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}bb 100%)` }}
          >
            <Zap size={15} /> Use This Template
          </button>
        </div>
      </div>
    </div>
  )
}
