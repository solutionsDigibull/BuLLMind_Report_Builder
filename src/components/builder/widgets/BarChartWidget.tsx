import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Row, WidgetConfig } from '../../../types'

interface Props {
  config: WidgetConfig
  data: Row[]
  selected?: boolean
  onClick?: () => void
}

function buildChartData(data: Row[], groupBy?: string, valueField?: string) {
  if (!groupBy || !valueField || data.length === 0) {
    return [
      { name: 'A', value: 400 },
      { name: 'B', value: 300 },
      { name: 'C', value: 500 },
      { name: 'D', value: 200 },
    ]
  }
  const map = new Map<string, number>()
  data.forEach((row) => {
    const key = String(row[groupBy] ?? 'Other')
    const val = Number(row[valueField]) || 0
    map.set(key, (map.get(key) ?? 0) + val)
  })
  return Array.from(map.entries())
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }))
}

export default function BarChartWidget({ config, data, selected, onClick }: Props) {
  const chartData = buildChartData(data, config.groupBy, config.dataField)

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
        selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <p className="text-xs font-semibold text-gray-700 mb-3">{config.title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="value" fill={config.color ?? '#2563eb'} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
