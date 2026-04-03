import { useNavigate } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts'
import { AlertTriangle, ArrowUpRight, BarChart2, Lightbulb, Package, ShoppingCart, TrendingUp, Upload, Users } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { Row } from '../types'

// ─── Mock / sample data ───────────────────────────────────────────────────────
const MOCK_COST_BY_CATEGORY = [
  { name: 'Electronics',    value: 945000 },
  { name: 'Mechanical',     value: 525000 },
  { name: 'Chemical',       value: 315000 },
  { name: 'Packaging',      value: 210000 },
  { name: 'Raw Materials',  value: 105000 },
]

const MOCK_QTY_BY_SUPPLIER = [
  { name: 'S-02', value: 3200 },
  { name: 'S-07', value: 2750 },
  { name: 'S-11', value: 1980 },
  { name: 'S-03', value: 1540 },
  { name: 'S-05', value: 1200 },
  { name: 'S-09', value: 890 },
  { name: 'S-01', value: 570 },
  { name: 'S-14', value: 320 },
]

const MOCK_TABLE_ROWS = [
  { part: 'PN-1001', description: 'Microcontroller Unit',   category: 'Electronics', supplier: 'S-02', qty: 1200, unitCost: '$45.50',  total: '$54,600',  status: 'Active'  },
  { part: 'PN-1045', description: 'PCB Assembly Board',     category: 'Electronics', supplier: 'S-07', qty:  850, unitCost: '$120.00', total: '$102,000', status: 'Active'  },
  { part: 'PN-2033', description: 'Hydraulic Pump',         category: 'Mechanical',  supplier: 'S-03', qty:  420, unitCost: '$380.00', total: '$159,600', status: 'Delayed' },
  { part: 'PN-3012', description: 'Chemical Compound X-7',  category: 'Chemical',    supplier: 'S-11', qty: 2100, unitCost: '$12.75',  total: '$26,775',  status: 'Pending' },
  { part: 'PN-4008', description: 'Protective Foam Sheet',  category: 'Packaging',   supplier: 'S-05', qty: 5600, unitCost: '$3.20',   total: '$17,920',  status: 'Active'  },
]

const INSIGHTS = [
  {
    icon: <TrendingUp size={16} />,
    color: 'blue',
    title: 'Electronics dominate cost',
    body: 'Electronic components contribute 45% of total procurement cost — review sourcing strategy for potential savings.',
  },
  {
    icon: <Users size={16} />,
    color: 'purple',
    title: 'Supplier S-02 leads volume',
    body: 'S-02 accounts for 25.7% of total quantity. Diversifying could reduce single-supplier risk.',
  },
  {
    icon: <AlertTriangle size={16} />,
    color: 'red',
    title: '23 components at risk',
    body: '23 line items have DELAYED status, representing $184K in potential procurement exposure.',
  },
  {
    icon: <Package size={16} />,
    color: 'amber',
    title: 'Packaging cost optimisation',
    body: 'Packaging category is lowest in cost but highest in units. Bulk negotiation could yield 12–18% savings.',
  },
]

const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#0891b2']
const SUPPLIER_COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#0891b2', '#dc2626', '#059669', '#9333ea']

// ─── Helpers ─────────────────────────────────────────────────────────────────
function groupBy(rows: Row[], key: string, valueKey: string) {
  const map = new Map<string, number>()
  rows.forEach((r) => {
    const k = String(r[key] ?? 'Other')
    const v = Number(r[valueKey]) || 0
    map.set(k, (map.get(k) ?? 0) + v)
  })
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}

function sumField(rows: Row[], key: string) {
  return rows.reduce((s, r) => s + (Number(r[key]) || 0), 0)
}

function fmt(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toLocaleString()}`
}

// ─── Custom donut label ───────────────────────────────────────────────────────
const DonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + (r + 28) * Math.cos(-midAngle * RADIAN)
  const y = cy + (r + 28) * Math.sin(-midAngle * RADIAN)
  if (percent < 0.07) return null
  return (
    <text x={x} y={y} fill="#374151" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Analytics() {
  const navigate = useNavigate()
  const uploads = useStore((s) => s.uploads)
  const allRows: Row[] = uploads.flatMap((u) => u.standardizedRows)
  const hasRealData = allRows.length > 0

  // KPIs — real or mock
  const totalCost      = hasRealData ? sumField(allRows, 'total_cost') : 2100000
  const totalQty       = hasRealData ? sumField(allRows, 'quantity')   : 12450
  const uniqueSuppliers = hasRealData
    ? new Set(allRows.map((r) => r.supplier).filter(Boolean)).size
    : 18
  const atRisk = hasRealData
    ? allRows.filter((r) => String(r.status).toUpperCase() === 'DELAYED').length
    : 23

  // Chart data — real or mock
  const costByCategory = hasRealData ? groupBy(allRows, 'category', 'total_cost') : MOCK_COST_BY_CATEGORY
  const qtyBySupplier  = hasRealData ? groupBy(allRows, 'supplier', 'quantity')   : MOCK_QTY_BY_SUPPLIER

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">

      {/* ── Top banner ────────────────────────────────────────────────────── */}
      {!hasRealData && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <BarChart2 size={16} className="text-amber-600" />
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Showing sample analytics data</p>
              <p className="text-xs text-amber-600 mt-0.5">Upload your data to generate real insights tailored to your procurement</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            <Upload size={13} /> Upload Data
          </button>
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            {hasRealData
              ? `Analysing ${allRows.length.toLocaleString()} rows across ${uploads.length} file${uploads.length !== 1 ? 's' : ''}`
              : 'Procurement performance overview · Sample dataset'}
          </p>
        </div>
        {hasRealData && (
          <span className="rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700">
            Live data
          </span>
        )}
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          icon={<TrendingUp size={18} className="text-blue-500" />}
          bg="bg-blue-50"
          label="Total Cost Value"
          value={fmt(totalCost)}
          sub="+8.4% vs last period"
          subColor="text-blue-500"
          valueColor="text-blue-700"
        />
        <KpiCard
          icon={<ShoppingCart size={18} className="text-green-500" />}
          bg="bg-green-50"
          label="Total Quantity"
          value={totalQty.toLocaleString()}
          sub="+3.1% vs last period"
          subColor="text-green-500"
          valueColor="text-green-700"
        />
        <KpiCard
          icon={<Users size={18} className="text-purple-500" />}
          bg="bg-purple-50"
          label="Unique Suppliers"
          value={String(uniqueSuppliers)}
          sub="Across 6 categories"
          subColor="text-purple-400"
          valueColor="text-purple-700"
        />
        <KpiCard
          icon={<AlertTriangle size={18} className="text-red-500" />}
          bg="bg-red-50"
          label="Delayed Items"
          value={String(atRisk)}
          sub="Requires immediate review"
          subColor="text-red-500"
          valueColor="text-red-600"
          highlight
        />
      </div>

      {/* ── Key Insights ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={15} className="text-amber-500" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Key Insights</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INSIGHTS.map((ins) => (
            <InsightCard key={ins.title} {...ins} />
          ))}
        </div>
      </section>

      {/* ── Charts ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Donut — cost by category */}
        <ChartCard title="Cost Breakdown by Category" subtitle="Donut · % share of total spend">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={costByCategory}
                cx="50%" cy="50%"
                innerRadius={65} outerRadius={105}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={DonutLabel}
              >
                {costByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bar — qty by supplier */}
        <ChartCard title="Quantity by Supplier" subtitle="Top 8 suppliers · unit count">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={qtyBySupplier} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} width={38} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => [v.toLocaleString(), 'Units']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {qtyBySupplier.map((_, i) => (
                  <Cell key={i} fill={SUPPLIER_COLORS[i % SUPPLIER_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Sample data table ─────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Sample Data Preview</h2>
            <p className="text-xs text-gray-400 mt-0.5">Showing 5 of 12,450 records · Replace with your data</p>
          </div>
          {!hasRealData && (
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-semibold text-amber-600 uppercase tracking-wide">
              Sample
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px]">
                {['Part No.', 'Description', 'Category', 'Supplier', 'Qty', 'Unit Cost', 'Total', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {MOCK_TABLE_ROWS.map((row) => (
                <tr key={row.part} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-700">{row.part}</td>
                  <td className="px-4 py-3 text-gray-600">{row.description}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{row.category}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-700">{row.supplier}</td>
                  <td className="px-4 py-3 text-gray-600">{row.qty.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{row.unitCost}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{row.total}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      {!hasRealData && (
        <div className="rounded-2xl border border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 px-8 py-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-blue-100">
            <Upload size={24} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Replace with your data</h3>
          <p className="mt-1.5 text-sm text-gray-500 max-w-sm mx-auto">
            Upload a CSV or Excel file to generate live analytics, KPIs, and insights from your own procurement data.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
          >
            <Upload size={15} /> Upload Data <ArrowUpRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  icon, bg, label, value, sub, subColor, valueColor, highlight = false,
}: {
  icon: React.ReactNode; bg: string; label: string; value: string
  sub: string; subColor: string; valueColor: string; highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 bg-white ${highlight ? 'border-red-200 shadow-sm shadow-red-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>{icon}</span>
        {highlight && (
          <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-600 uppercase">Risk</span>
        )}
      </div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-extrabold mt-0.5 ${valueColor}`}>{value}</p>
      <p className={`text-[11px] mt-1.5 font-medium ${subColor}`}>{sub}</p>
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-1">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function InsightCard({
  icon, color, title, body,
}: {
  icon: React.ReactNode; color: string; title: string; body: string
}) {
  const palette: Record<string, { bg: string; icon: string; border: string }> = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500',   border: 'border-blue-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-100' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-500',    border: 'border-red-100' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-500',  border: 'border-amber-100' },
  }
  const p = palette[color] ?? palette.blue
  return (
    <div className={`rounded-xl border ${p.border} bg-white p-4 flex flex-col gap-2`}>
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${p.bg} ${p.icon}`}>{icon}</span>
      <p className="text-xs font-semibold text-gray-800 leading-snug">{title}</p>
      <p className="text-[11px] text-gray-500 leading-relaxed">{body}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active:  'bg-green-50 text-green-700 border-green-200',
    Delayed: 'bg-red-50 text-red-700 border-red-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${map[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  )
}
