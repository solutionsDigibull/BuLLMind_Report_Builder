import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Row, WidgetConfig } from '../../../types'

const COLORS = ['#2563eb', '#60a5fa', '#93c5fd', '#1e40af', '#3b82f6', '#bfdbfe']

interface Props {
  config: WidgetConfig
  data: Row[]
  selected?: boolean
  onClick?: () => void
}

function buildPieData(data: Row[], groupBy?: string, valueField?: string) {
  if (!groupBy || !valueField || data.length === 0) {
    return [
      { name: 'Mechanical', value: 45 },
      { name: 'Electronic', value: 30 },
      { name: 'Fasteners', value: 25 },
    ]
  }
  const map = new Map<string, number>()
  data.forEach((row) => {
    const key = String(row[groupBy] ?? 'Other')
    const val = Number(row[valueField]) || 0
    map.set(key, (map.get(key) ?? 0) + val)
  })
  return Array.from(map.entries())
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }))
}

export default function PieChartWidget({ config, data, selected, onClick }: Props) {
  const chartData = buildPieData(data, config.groupBy, config.dataField)
  const total = chartData.reduce((s, d) => s + d.value, 0)

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
        selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <p className="text-xs font-semibold text-gray-700 mb-3">{config.title}</p>
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              dataKey="value"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center mt-[-10px]">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-sm font-bold text-gray-800">
              {total > 1000 ? `${(total / 1000).toFixed(0)}K` : total}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
