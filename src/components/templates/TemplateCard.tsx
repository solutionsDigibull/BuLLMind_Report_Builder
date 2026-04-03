import { Heart } from 'lucide-react'
import type { Template } from '../../types'

const CATEGORY_COLORS: Record<string, string> = {
  PRODUCTION: 'bg-blue-100 text-blue-700',
  ANALYTICS: 'bg-purple-100 text-purple-700',
  LOGISTICS: 'bg-green-100 text-green-700',
  FINANCE: 'bg-amber-100 text-amber-700',
  QUALITY: 'bg-red-100 text-red-700',
  INVENTORY: 'bg-cyan-100 text-cyan-700',
  PURCHASING: 'bg-orange-100 text-orange-700',
  BOM: 'bg-indigo-100 text-indigo-700',
}

interface Props {
  template: Template
  selected: boolean
  isFavorite: boolean
  onSelect: () => void
  onToggleFavorite: () => void
}

export default function TemplateCard({ template, selected, isFavorite, onSelect, onToggleFavorite }: Props) {
  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-md ${
        selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Thumbnail */}
      <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
        <ThumbnailPreview category={template.category} />
        {selected && <div className="absolute inset-0 bg-blue-600/10" />}
        {/* Favorite button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400 hover:text-red-400'
          }`}
        >
          <Heart size={13} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <span
          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide mb-1.5 ${
            CATEGORY_COLORS[template.category] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {template.category}
        </span>
        <h3 className="text-sm font-semibold text-gray-900 leading-tight">{template.name}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
        <div className="flex gap-1 mt-2 flex-wrap">
          {template.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ThumbnailPreview({ category }: { category: string }) {
  const colors: Record<string, string[]> = {
    PRODUCTION: ['#2563eb', '#60a5fa', '#93c5fd'],
    ANALYTICS: ['#7c3aed', '#a78bfa', '#c4b5fd'],
    LOGISTICS: ['#16a34a', '#4ade80', '#86efac'],
    FINANCE: ['#d97706', '#fbbf24', '#fde68a'],
    QUALITY: ['#dc2626', '#f87171', '#fca5a5'],
    INVENTORY: ['#0891b2', '#22d3ee', '#67e8f9'],
    PURCHASING: ['#ea580c', '#fb923c', '#fdba74'],
    BOM: ['#4f46e5', '#818cf8', '#a5b4fc'],
  }
  const c = colors[category] ?? colors.PRODUCTION
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full opacity-60">
      {[40, 60, 45, 75, 55, 80].map((h, i) => (
        <rect key={i} x={20 + i * 28} y={100 - h} width={18} height={h} fill={i % 2 === 0 ? c[0] : c[1]} rx={2} />
      ))}
      <rect x={10} y={10} width={55} height={25} rx={4} fill="white" opacity={0.8} />
      <rect x={70} y={10} width={55} height={25} rx={4} fill="white" opacity={0.8} />
      <rect x={130} y={10} width={55} height={25} rx={4} fill="white" opacity={0.8} />
    </svg>
  )
}
