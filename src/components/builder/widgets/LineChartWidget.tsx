import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Row, WidgetConfig } from '../../../types'

const DEMO = [
  { name: 'W1', value: 312 }, { name: 'W2', value: 445 }, { name: 'W3', value: 389 },
  { name: 'W4', value: 502 }, { name: 'W5', value: 478 }, { name: 'W6', value: 541 },
  { name: 'W7', value: 620 },
]

interface Props {
  config: WidgetConfig
  data: Row[]
  selected?: boolean
  onClick?: () => void
}

export default function LineChartWidget({ config, data, selected, onClick }: Props) {
  const chartData = data.length > 0 && config.dataField
    ? data.slice(0, 20).map((r, i) => ({ name: `#${i + 1}`, value: Number(r[config.dataField!]) || 0 }))
    : DEMO

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
        selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <p className="text-xs font-semibold text-gray-700 mb-3">{config.title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke={config.color ?? '#2563eb'}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
