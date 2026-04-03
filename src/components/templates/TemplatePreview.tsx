import { RefreshCw } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import type { Template } from '../../types'
import { exportToCsv } from '../../utils/exportCsv'

// ── Sample data per category ────────────────────────────────────────────────
const SAMPLE: Record<string, {
  kpis: { label: string; value: string; trend: string; up: boolean; danger?: boolean }[]
  pie: { name: string; value: number }[]
  bar: { name: string; value: number }[]
  table: Record<string, string>[]
  pieLabel: string
  barLabel: string
  tableTitle: string
}> = {
  PRODUCTION: {
    kpis: [
      { label: 'Total BOM Items', value: '1,245', trend: '+12%', up: true },
      { label: 'Total BOM Value', value: '$2.1M', trend: '+4.5%', up: true },
      { label: 'At-Risk Components', value: '23', trend: '+2', up: false, danger: true },
    ],
    pie: [{ name: 'Mechanical', value: 45 }, { name: 'Electronic', value: 30 }, { name: 'Fasteners', value: 25 }],
    bar: [{ name: 'S-01', value: 30 }, { name: 'S-02', value: 80 }, { name: 'S-03', value: 55 }, { name: 'S-04', value: 65 }],
    table: [
      { fg: 'TX-900 Core', level: '1.0', assembly: 'Power Unit', cpn: 'P-55210', cost: '$145.00', status: 'ACTIVE' },
      { fg: 'TX-900 Core', level: '1.1', assembly: 'Control Board', cpn: 'E-99120', cost: '$89.20', status: 'DELAYED' },
      { fg: 'TX-900 Core', level: '1.2', assembly: 'Casing Shell', cpn: 'M-11024', cost: '$42.50', status: 'ACTIVE' },
    ],
    pieLabel: 'Cost Breakdown by Category', barLabel: 'Quantity by Supplier', tableTitle: 'Bill of Materials Review',
  },
  ANALYTICS: {
    kpis: [
      { label: 'OEE Score', value: '87.4%', trend: '+3.2%', up: true },
      { label: 'Throughput', value: '34,102', trend: '+8.1%', up: true },
      { label: 'Downtime Events', value: '12', trend: '+3', up: false, danger: true },
    ],
    pie: [{ name: 'Planned', value: 55 }, { name: 'Unplanned', value: 30 }, { name: 'Idle', value: 15 }],
    bar: [{ name: 'Mon', value: 88 }, { name: 'Tue', value: 91 }, { name: 'Wed', value: 76 }, { name: 'Thu', value: 93 }, { name: 'Fri', value: 85 }],
    table: [
      { machine: 'Line A', oee: '91%', output: '12,400', downtime: '2h', status: 'ACTIVE' },
      { machine: 'Line B', oee: '78%', output: '9,800', downtime: '5h', status: 'DELAYED' },
      { machine: 'Line C', oee: '95%', output: '13,100', downtime: '0.5h', status: 'ACTIVE' },
    ],
    pieLabel: 'Downtime Distribution', barLabel: 'Daily OEE %', tableTitle: 'Machine Performance',
  },
  LOGISTICS: {
    kpis: [
      { label: 'Active Shipments', value: '482', trend: '+7%', up: true },
      { label: 'On-Time Delivery', value: '94.2%', trend: '+1.1%', up: true },
      { label: 'Delayed', value: '18', trend: '+4', up: false, danger: true },
    ],
    pie: [{ name: 'In Transit', value: 52 }, { name: 'Delivered', value: 38 }, { name: 'Pending', value: 10 }],
    bar: [{ name: 'APAC', value: 145 }, { name: 'EMEA', value: 210 }, { name: 'AMER', value: 127 }],
    table: [
      { shipment: 'SH-10291', origin: 'Shanghai', dest: 'Hamburg', eta: '2024-04-12', status: 'ACTIVE' },
      { shipment: 'SH-10302', origin: 'LA', dest: 'NYC', eta: '2024-04-08', status: 'DELAYED' },
      { shipment: 'SH-10315', origin: 'Mumbai', dest: 'Dubai', eta: '2024-04-15', status: 'ACTIVE' },
    ],
    pieLabel: 'Shipment Status', barLabel: 'Shipments by Region', tableTitle: 'Active Shipments',
  },
  FINANCE: {
    kpis: [
      { label: 'Total Spend', value: '$8.4M', trend: '+6.2%', up: false },
      { label: 'Unique Vendors', value: '127', trend: '+5', up: true },
      { label: 'Savings Identified', value: '$241K', trend: '+12%', up: true },
    ],
    pie: [{ name: 'Direct', value: 60 }, { name: 'Indirect', value: 25 }, { name: 'Services', value: 15 }],
    bar: [{ name: 'Q1', value: 1800 }, { name: 'Q2', value: 2100 }, { name: 'Q3', value: 2400 }, { name: 'Q4', value: 2100 }],
    table: [
      { vendor: 'Acme Corp', category: 'Direct', spend: '$1.2M', po_count: '34', status: 'ACTIVE' },
      { vendor: 'FastParts', category: 'Direct', spend: '$890K', po_count: '28', status: 'ACTIVE' },
      { vendor: 'OfficeMax', category: 'Indirect', spend: '$45K', po_count: '12', status: 'ACTIVE' },
    ],
    pieLabel: 'Spend by Type', barLabel: 'Quarterly Spend ($K)', tableTitle: 'Vendor Summary',
  },
  QUALITY: {
    kpis: [
      { label: 'Pass Rate', value: '96.8%', trend: '+0.4%', up: true },
      { label: 'Defects Found', value: '142', trend: '-8%', up: true },
      { label: 'Open CAPAs', value: '7', trend: '+1', up: false, danger: true },
    ],
    pie: [{ name: 'Dimensional', value: 40 }, { name: 'Surface', value: 35 }, { name: 'Functional', value: 25 }],
    bar: [{ name: 'Jan', value: 22 }, { name: 'Feb', value: 18 }, { name: 'Mar', value: 15 }, { name: 'Apr', value: 11 }],
    table: [
      { part: 'P-55210', inspections: '240', passed: '234', defects: '6', status: 'ACTIVE' },
      { part: 'E-99120', inspections: '180', passed: '172', defects: '8', status: 'DELAYED' },
      { part: 'M-11024', inspections: '300', passed: '298', defects: '2', status: 'ACTIVE' },
    ],
    pieLabel: 'Defect Types', barLabel: 'Monthly Defects', tableTitle: 'Inspection Summary',
  },
  INVENTORY: {
    kpis: [
      { label: 'Total SKUs', value: '3,841', trend: '+2.1%', up: true },
      { label: 'Total Qty on Hand', value: '128,450', trend: '-1.4%', up: false },
      { label: 'Stock Value', value: '$4.6M', trend: '+3.8%', up: true },
    ],
    pie: [{ name: 'Healthy', value: 62 }, { name: 'Low Stock', value: 24 }, { name: 'Overstock', value: 14 }],
    bar: [{ name: 'Raw Mat.', value: 420 }, { name: 'WIP', value: 185 }, { name: 'Finished', value: 310 }, { name: 'Spare', value: 95 }],
    table: [
      { sku: 'RM-10041', description: 'Steel Rod 12mm', qty: '2,400', value: '$18,600', status: 'ACTIVE' },
      { sku: 'WIP-2210', description: 'Sub-Assy Frame', qty: '320', value: '$42,880', status: 'ACTIVE' },
      { sku: 'FG-5501', description: 'TX-900 Unit', qty: '85', value: '$127,500', status: 'DELAYED' },
    ],
    pieLabel: 'Stock Status Distribution', barLabel: 'Qty by Category', tableTitle: 'Inventory Overview',
  },
  PURCHASING: {
    kpis: [
      { label: 'Total Procurement Spend', value: '$6.2M', trend: '+5.4%', up: false },
      { label: 'Active Vendors', value: '84', trend: '+3', up: true },
      { label: 'Pending POs', value: '37', trend: '+6', up: false, danger: true },
    ],
    pie: [{ name: 'Direct', value: 58 }, { name: 'Indirect', value: 27 }, { name: 'Services', value: 15 }],
    bar: [{ name: 'Acme', value: 1200 }, { name: 'FastParts', value: 980 }, { name: 'GlobalSup', value: 760 }, { name: 'MetalCo', value: 540 }],
    table: [
      { po: 'PO-20441', vendor: 'Acme Corp', amount: '$124,800', delivery: '2024-04-18', status: 'ACTIVE' },
      { po: 'PO-20452', vendor: 'FastParts', amount: '$87,200', delivery: '2024-04-22', status: 'DELAYED' },
      { po: 'PO-20461', vendor: 'GlobalSup', amount: '$55,600', delivery: '2024-04-30', status: 'ACTIVE' },
    ],
    pieLabel: 'Spend by Type', barLabel: 'Top Vendors Spend ($K)', tableTitle: 'Purchase Order List',
  },
  BOM: {
    kpis: [
      { label: 'Total BOM Items', value: '1,245', trend: '+12%', up: true },
      { label: 'Total BOM Value', value: '$2.1M', trend: '+4.5%', up: true },
      { label: 'At-Risk Components', value: '23', trend: '+2', up: false, danger: true },
    ],
    pie: [{ name: 'Mechanical', value: 45 }, { name: 'Electronic', value: 30 }, { name: 'Fasteners', value: 25 }],
    bar: [{ name: 'Level 1', value: 12 }, { name: 'Level 2', value: 38 }, { name: 'Level 3', value: 64 }, { name: 'Level 4', value: 29 }],
    table: [
      { fg: 'TX-900 Core', level: '1.0', assembly: 'Power Unit', cpn: 'P-55210', cost: '$145.00', status: 'ACTIVE' },
      { fg: 'TX-900 Core', level: '1.1', assembly: 'Control Board', cpn: 'E-99120', cost: '$89.20', status: 'DELAYED' },
      { fg: 'TX-900 Core', level: '1.2', assembly: 'Casing Shell', cpn: 'M-11024', cost: '$42.50', status: 'ACTIVE' },
    ],
    pieLabel: 'Cost Breakdown by Category', barLabel: 'BOM Items by Level', tableTitle: 'Bill of Materials',
  },
}

const PIE_COLORS = ['#2563eb', '#60a5fa', '#93c5fd', '#1e40af']

export default function TemplatePreview({ template }: { template: Template }) {
  const { loadTemplate, showToast } = useStore()
  const navigate = useNavigate()
  const sample = SAMPLE[template.category] ?? SAMPLE.PRODUCTION

  const handleUse = () => {
    loadTemplate(template.widgets, template.name)
    showToast(`Template "${template.name}" loaded!`, 'success')
    navigate('/builder')
  }

  const handleExportSample = () => {
    exportToCsv(sample.table, `${template.id}_sample`)
    showToast('Sample data exported!', 'success')
  }

  return (
    <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden bg-white flex flex-col h-full">
      {/* Preview header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Live Preview with Sample Data
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>Dataset: Global_Ops_2024_Q3</span>
          <span className="flex items-center gap-1">
            <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '3s' }} />
            Refresh: 2m ago
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-100">
        {sample.kpis.map((kpi) => (
          <div key={kpi.label} className="border border-gray-100 rounded-lg p-3">
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.danger ? 'text-red-600' : 'text-gray-900'}`}>{kpi.value}</p>
            <p className={`text-xs mt-0.5 font-medium ${kpi.up ? 'text-green-600' : kpi.danger ? 'text-red-500' : 'text-amber-600'}`}>
              ↗ {kpi.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-100">
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">{sample.pieLabel}</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={sample.pie} cx="40%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value">
                {sample.pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">{sample.barLabel}</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={sample.bar} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                {sample.bar.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="p-4 flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{sample.tableTitle}</p>
          <button onClick={handleExportSample} className="text-xs text-blue-600 hover:underline">
            Export CSV
          </button>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              {Object.keys(sample.table[0] ?? {}).map((h) => (
                <th key={h} className="text-left py-1.5 text-[10px] font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sample.table.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                {Object.entries(row).map(([k, v]) => (
                  <td key={k} className="py-1.5 text-gray-700 pr-3">
                    {k === 'status' ? (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${v === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{v}</span>
                    ) : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100 flex gap-2">
        <button
          onClick={handleUse}
          className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Use This Template
        </button>
        <button
          onClick={handleExportSample}
          className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Export Sample
        </button>
      </div>
    </div>
  )
}
