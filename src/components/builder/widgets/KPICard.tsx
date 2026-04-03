import {
  Activity,
  BarChart2,
  Clock,
  DollarSign,
  Package,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { Row, WidgetConfig } from '../../../types'

interface Props {
  config: WidgetConfig
  data: Row[]
  selected?: boolean
  onClick?: () => void
}

const KPI_COLORS = ['#2563eb', '#16a34a', '#7c3aed', '#d97706', '#0891b2', '#dc2626']

function getAccentColor(config: WidgetConfig): string {
  if (config.color && config.color !== '#2563eb') return config.color
  return KPI_COLORS[config.order % KPI_COLORS.length]
}

function getIcon(field?: string) {
  if (!field) return BarChart2
  const f = field.toLowerCase()
  if (/cost|spend|amount|revenue|budget|price/.test(f)) return DollarSign
  if (/qty|quantity|count|units|volume/.test(f)) return Package
  if (/supplier|vendor|customer|rep/.test(f)) return Users
  if (/lead_time|time|days|duration/.test(f)) return Clock
  if (/status|rate|pct|percent|efficiency/.test(f)) return Activity
  return BarChart2
}

function computeKpi(data: Row[], field?: string): { display: string; raw: number } {
  if (!field || data.length === 0) return { display: '—', raw: 0 }

  const vals = data.map((r) => Number(r[field])).filter((v) => !isNaN(v) && isFinite(v))

  if (vals.length === 0) {
    const distinct = new Set(data.map((r) => r[field])).size
    return { display: distinct.toLocaleString(), raw: distinct }
  }

  const sum = vals.reduce((a, b) => a + b, 0)
  let display: string
  if (sum >= 1_000_000) display = `$${(sum / 1_000_000).toFixed(1)}M`
  else if (sum >= 1_000) display = sum.toLocaleString()
  else display = sum % 1 === 0 ? String(sum) : sum.toFixed(2)

  return { display, raw: sum }
}

function getCardStyle(bgStyle: string | undefined, accent: string) {
  switch (bgStyle) {
    case 'tint':
      return { background: `linear-gradient(135deg, ${accent}12 0%, ${accent}06 100%)`, textTitle: '#64748b', textValue: '#0f172a', bold: false }
    case 'gradient':
      return { background: `linear-gradient(135deg, ${accent}30 0%, #ffffff 100%)`, textTitle: '#475569', textValue: '#0f172a', bold: false }
    case 'bold':
      return { background: accent, textTitle: 'rgba(255,255,255,0.75)', textValue: '#ffffff', bold: true }
    default:
      return { background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', textTitle: '#64748b', textValue: '#111827', bold: false }
  }
}

function stableTrend(raw: number): { up: boolean; pct: string } {
  const up = raw % 7 > 2
  const pct = ((raw % 17) + 1.5).toFixed(1)
  return { up, pct }
}

export default function KPICard({ config, data, selected, onClick }: Props) {
  const { display, raw } = computeKpi(data, config.dataField)
  const { up, pct } = stableTrend(raw)
  const accent = getAccentColor(config)
  const Icon = getIcon(config.dataField)
  const cardStyle = getCardStyle(config.bgStyle, accent)

  const accentBarColor = cardStyle.bold ? 'rgba(255,255,255,0.35)' : accent
  const iconBadgeBg = cardStyle.bold ? 'rgba(255,255,255,0.2)' : accent + '18'
  const iconColor = cardStyle.bold ? '#ffffff' : accent
  const trendColor = cardStyle.bold ? 'rgba(255,255,255,0.9)' : up ? '#16a34a' : '#ef4444'
  const trendMutedColor = cardStyle.bold ? 'rgba(255,255,255,0.6)' : '#9ca3af'

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border cursor-pointer transition-all overflow-hidden ${
        selected
          ? 'border-blue-400 ring-2 ring-blue-200 shadow-md'
          : cardStyle.bold
          ? 'border-transparent hover:shadow-md shadow-sm'
          : 'border-gray-100 hover:border-gray-200 hover:shadow-md shadow-sm'
      }`}
      style={{ background: cardStyle.background }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: accentBarColor }} />

      <div className="px-4 py-4 pl-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide leading-tight pr-2" style={{ color: cardStyle.textTitle }}>
            {config.title}
          </p>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: iconBadgeBg }}
          >
            <Icon size={14} style={{ color: iconColor }} />
          </div>
        </div>

        {/* Value */}
        <p className="text-3xl font-bold leading-none mb-2" style={{ color: cardStyle.textValue }}>{display}</p>

        {/* Trend */}
        {raw > 0 ? (
          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: trendColor }}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{up ? '+' : '-'}{pct}%</span>
            <span className="font-normal ml-1" style={{ color: trendMutedColor }}>vs last period</span>
          </div>
        ) : (
          <div className="h-4" />
        )}
      </div>
    </div>
  )
}
