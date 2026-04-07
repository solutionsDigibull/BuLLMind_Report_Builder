import { BarChart2, Eye, Search, Star, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import type { Template, WidgetConfig } from '../types'

// ─── Category metadata ────────────────────────────────────────────────────────

export const CATEGORY_META: Record<string, { color: string; bg: string; label: string }> = {
  PRODUCTION: { color: '#3b82f6', bg: '#eff6ff', label: 'Production' },
  FINANCE:    { color: '#10b981', bg: '#ecfdf5', label: 'Finance'    },
  INVENTORY:  { color: '#8b5cf6', bg: '#f5f3ff', label: 'Inventory'  },
  PURCHASING: { color: '#f59e0b', bg: '#fffbeb', label: 'Purchasing' },
  BOM:        { color: '#4f46e5', bg: '#eef2ff', label: 'BOM'        },
  QUALITY:    { color: '#ef4444', bg: '#fef2f2', label: 'Quality'    },
}

const RECOMMENDED_IDS = [
  'prod-efficiency-dashboard', 'fin-pl-summary', 'inv-health-monitor',
  'pur-spend-analysis', 'qual-control-dashboard', 'bom-cost-breakdown',
]

const TABS = [
  { id: 'ALL',         label: 'All'         },
  { id: 'RECOMMENDED', label: 'Recommended' },
  { id: 'FAVORITES',   label: 'Favorites'   },
]

// Multi-select filter tags
const FILTER_TAGS = [
  { id: 'SALES',      label: 'Sales',      color: '#f59e0b', bg: '#fffbeb' },
  { id: 'PRODUCTION', label: 'Production', color: CATEGORY_META.PRODUCTION.color, bg: CATEGORY_META.PRODUCTION.bg },
  { id: 'FINANCE',    label: 'Finance',    color: CATEGORY_META.FINANCE.color,    bg: CATEGORY_META.FINANCE.bg    },
  { id: 'INVENTORY',  label: 'Inventory',  color: CATEGORY_META.INVENTORY.color,  bg: CATEGORY_META.INVENTORY.bg  },
  { id: 'BOM',        label: 'BOM',        color: CATEGORY_META.BOM.color,        bg: CATEGORY_META.BOM.bg        },
  { id: 'PURCHASING', label: 'Purchasing', color: CATEGORY_META.PURCHASING.color, bg: CATEGORY_META.PURCHASING.bg },
  { id: 'QUALITY',    label: 'Quality',    color: CATEGORY_META.QUALITY.color,    bg: CATEGORY_META.QUALITY.bg    },
]

const SALES_KEYWORDS = new Set(['Revenue', 'P&L', 'Sales', 'Cash Flow', 'Order', 'Customer', 'Delivery', 'Liquidity'])

// ─── Mini card preview ────────────────────────────────────────────────────────

function MiniPreview({ template }: { template: Template }) {
  if (template.thumbnail) {
    return (
      <img
        src={template.thumbnail}
        alt={template.name}
        className="w-full h-[72px] object-cover rounded-lg"
      />
    )
  }
  const meta = CATEGORY_META[template.category] ?? CATEGORY_META.PRODUCTION
  const kpis     = template.widgets.filter(w => w.type === 'kpi').slice(0, 3)
  const hasBar   = template.widgets.some(w => w.type === 'bar-chart')
  const hasLine  = template.widgets.some(w => w.type === 'line-chart')
  const hasPie   = template.widgets.some(w => w.type === 'pie-chart')

  return (
    <div className="w-full h-[72px] rounded-lg p-2 flex flex-col gap-1.5" style={{ background: meta.bg }}>
      {/* KPI row */}
      <div className="flex gap-1">
        {kpis.map((_, i) => (
          <div key={i} className="flex-1 h-5 rounded-md flex items-center px-1.5" style={{ background: meta.color + '20' }}>
            <div className="w-full h-1 rounded-full" style={{ background: meta.color + 'aa' }} />
          </div>
        ))}
      </div>
      {/* Chart row */}
      <div className="flex gap-1 flex-1">
        <div className="flex-[2] rounded-md overflow-hidden" style={{ background: meta.color + '15' }}>
          {hasBar && (
            <div className="w-full h-full flex items-end gap-0.5 px-1.5 pb-1">
              {[55, 85, 40, 70, 50].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: meta.color + 'aa' }} />
              ))}
            </div>
          )}
          {hasLine && !hasBar && (
            <svg viewBox="0 0 60 20" className="w-full h-full" preserveAspectRatio="none">
              <polyline points="0,15 12,7 24,11 36,3 48,8 60,5" fill="none" stroke={meta.color} strokeWidth="1.5" opacity="0.7" />
            </svg>
          )}
        </div>
        {hasPie ? (
          <div className="flex-1 rounded-md flex items-center justify-center" style={{ background: meta.color + '15' }}>
            <svg viewBox="0 0 20 20" className="w-6 h-6">
              <circle cx="10" cy="10" r="7" fill="none" stroke={meta.color} strokeWidth="4" strokeDasharray="22 22" opacity="0.8" />
              <circle cx="10" cy="10" r="7" fill="none" stroke={meta.color + '44'} strokeWidth="4" strokeDasharray="12 32" strokeDashoffset="-22" opacity="0.8" />
            </svg>
          </div>
        ) : (
          <div className="flex-1 rounded-md" style={{ background: meta.color + '15' }} />
        )}
      </div>
    </div>
  )
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateGalleryCard({
  template, isFavorite, onFavorite, onView, onUse,
}: {
  template: Template; isFavorite: boolean
  onFavorite: () => void; onView: () => void; onUse: () => void
}) {
  const meta = CATEGORY_META[template.category] ?? CATEGORY_META.PRODUCTION

  return (
    <div
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 4px rgba(30,60,120,0.06)' }}
    >
      <div className="p-2.5 pb-0 cursor-pointer" onClick={onView}>
        <MiniPreview template={template} />
      </div>

      <div className="px-3 pt-2 pb-2.5">
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2 flex-1">{template.name}</p>
          <button
            onClick={e => { e.stopPropagation(); onFavorite() }}
            className="shrink-0 mt-0.5 transition-colors"
          >
            <Star
              size={12}
              fill={isFavorite ? 'currentColor' : 'none'}
              className={isFavorite ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}
            />
          </button>
        </div>

        <span
          className="inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full mb-2.5"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.label}
        </span>

        {/* Action buttons — always visible, not just on hover */}
        <div className="flex gap-1.5">
          <button
            onClick={onView}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold border border-gray-200 text-slate-600 hover:bg-gray-50 transition-colors"
          >
            <Eye size={10} /> View
          </button>
          <button
            onClick={onUse}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold text-white transition-opacity hover:opacity-85"
            style={{ background: meta.color }}
          >
            <Zap size={10} /> Use
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Preview modal ────────────────────────────────────────────────────────────

function PreviewModal({
  template, isFavorite, onFavorite, onClose, onUse,
}: {
  template: Template; isFavorite: boolean
  onFavorite: () => void; onClose: () => void; onUse: () => void
}) {
  const meta = CATEGORY_META[template.category] ?? CATEGORY_META.PRODUCTION
  const kpiWidgets   = template.widgets.filter(w => w.type === 'kpi')
  const chartWidgets = template.widgets.filter(w => w.type !== 'kpi' && w.type !== 'table')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: meta.bg }}>
              <BarChart2 size={16} style={{ color: meta.color }} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">{template.name}</p>
              <span
                className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                style={{ background: meta.bg, color: meta.color }}
              >
                {meta.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onFavorite} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-amber-400' : 'text-gray-400'} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="px-5 pt-3 pb-2">
          <p className="text-xs text-slate-500 leading-relaxed">{template.description}</p>
        </div>

        {/* KPI blocks */}
        <div className="px-5 pb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Included Widgets</p>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {kpiWidgets.slice(0, 3).map(w => (
              <div key={w.id} className="rounded-lg p-2" style={{ background: meta.bg }}>
                <div className="w-5 h-1 rounded-full mb-1.5" style={{ background: meta.color }} />
                <p className="text-[10px] font-semibold text-slate-700 leading-snug">{w.title}</p>
              </div>
            ))}
          </div>

          {/* Chart type badges */}
          <div className="flex flex-wrap gap-1 mb-3">
            {chartWidgets.map(w => (
              <span key={w.id} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-slate-500 capitalize">
                {w.type.replace('-', ' ')}
              </span>
            ))}
            {template.widgets.some(w => w.type === 'table') && (
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-slate-500">
                Data table
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {template.tags.map(tag => (
              <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full border border-gray-200 text-slate-400">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-slate-600 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onUse}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)` }}
          >
            ⚡ Use Template
          </button>
        </div>
      </div>
    </div>
  )
}

export const TEMPLATES: Template[] = [
  // ─── PRODUCTION (5) ───────────────────────────────────────────────────────
  {
    id: 'prod-daily-summary',
    thumbnail: '/thumbnails/daily-production-report.avif',
    name: 'Daily Production Summary',
    description: 'End-of-day overview of total output, scrap, and efficiency for plant managers and supervisors.',
    category: 'PRODUCTION',
    tags: ['Daily', 'Output', 'Plant Manager'],
    widgets: [
      { id: 'pd1', type: 'kpi', title: 'Total Units Produced', dataField: 'quantity', order: 0, span: 1, color: '#2563eb' },
      { id: 'pd2', type: 'kpi', title: 'Scrap / Rejection', dataField: 'status', order: 1, span: 1, color: '#dc2626' },
      { id: 'pd3', type: 'kpi', title: 'Efficiency %', dataField: 'total_cost', order: 2, span: 1, color: '#16a34a' },
      { id: 'pd4', type: 'bar-chart', title: 'Output by Product Line', dataField: 'quantity', groupBy: 'category', order: 3, span: 2, color: '#2563eb' },
      { id: 'pd5', type: 'pie-chart', title: 'Good vs Rejected', dataField: 'quantity', groupBy: 'status', order: 4, span: 1, color: '#93c5fd' },
      { id: 'pd6', type: 'table', title: 'Production Log', order: 5, span: 3, color: '#2563eb' },
    ] as WidgetConfig[],
  },
  {
    id: 'prod-efficiency-dashboard',
    thumbnail: '/thumbnails/production-efficiency.jpg',
    name: 'Production Efficiency Dashboard',
    description: 'Track OEE, throughput, and downtime patterns — ideal for CEO and operations directors.',
    category: 'PRODUCTION',
    tags: ['OEE', 'KPIs', 'CEO', 'Directors'],
    widgets: [
      { id: 'pe1', type: 'kpi', title: 'OEE Score', dataField: 'quantity', order: 0, span: 1, color: '#7c3aed' },
      { id: 'pe2', type: 'kpi', title: 'Throughput Rate', dataField: 'total_cost', order: 1, span: 1, color: '#7c3aed' },
      { id: 'pe3', type: 'kpi', title: 'Downtime Hours', dataField: 'lead_time', order: 2, span: 1, color: '#dc2626' },
      { id: 'pe4', type: 'line-chart', title: 'Efficiency Trend (Weekly)', dataField: 'quantity', order: 3, span: 2, color: '#7c3aed' },
      { id: 'pe5', type: 'bar-chart', title: 'Downtime by Category', dataField: 'quantity', groupBy: 'category', order: 4, span: 1, color: '#a78bfa' },
      { id: 'pe6', type: 'table', title: 'Production Records', order: 5, span: 3, color: '#7c3aed' },
    ] as WidgetConfig[],
  },
  {
    id: 'prod-machine-performance',
    thumbnail: '/thumbnails/machine-performance-report.png',
    name: 'Machine Performance Report',
    description: 'Monitor equipment uptime, fault frequency, and MTTR for maintenance managers.',
    category: 'PRODUCTION',
    tags: ['Maintenance', 'Uptime', 'Equipment'],
    widgets: [
      { id: 'mp1', type: 'kpi', title: 'Avg Machine Uptime %', dataField: 'quantity', order: 0, span: 1, color: '#0891b2' },
      { id: 'mp2', type: 'kpi', title: 'Total Faults', dataField: 'status', order: 1, span: 1, color: '#dc2626' },
      { id: 'mp3', type: 'kpi', title: 'MTTR (Hours)', dataField: 'lead_time', order: 2, span: 1, color: '#d97706' },
      { id: 'mp4', type: 'bar-chart', title: 'Uptime by Machine', dataField: 'quantity', groupBy: 'part_number', order: 3, span: 2, color: '#0891b2' },
      { id: 'mp5', type: 'pie-chart', title: 'Fault Type Distribution', dataField: 'quantity', groupBy: 'category', order: 4, span: 1, color: '#67e8f9' },
      { id: 'mp6', type: 'table', title: 'Machine Fault Log', order: 5, span: 3, color: '#0891b2' },
    ] as WidgetConfig[],
  },
  {
    id: 'prod-shift-report',
    thumbnail: '/thumbnails/shift-wise-output-report.webp',
    name: 'Shift-wise Output Report',
    description: 'Compare A/B/C shift performance on output, quality, and utilization for production managers.',
    category: 'PRODUCTION',
    tags: ['Shift', 'Comparison', 'Manager'],
    widgets: [
      { id: 'sw1', type: 'kpi', title: 'Best Shift Output', dataField: 'quantity', order: 0, span: 1, color: '#16a34a' },
      { id: 'sw2', type: 'kpi', title: 'Total Shifts', dataField: 'level', order: 1, span: 1, color: '#16a34a' },
      { id: 'sw3', type: 'kpi', title: 'Avg Output / Shift', dataField: 'total_cost', order: 2, span: 1, color: '#16a34a' },
      { id: 'sw4', type: 'bar-chart', title: 'Output per Shift', dataField: 'quantity', groupBy: 'category', order: 3, span: 2, color: '#16a34a' },
      { id: 'sw5', type: 'pie-chart', title: 'Shift Contribution %', dataField: 'quantity', groupBy: 'status', order: 4, span: 1, color: '#4ade80' },
      { id: 'sw6', type: 'table', title: 'Shift Detail Report', order: 5, span: 3, color: '#16a34a' },
    ] as WidgetConfig[],
  },
  {
    id: 'prod-vs-target',
    thumbnail: '/thumbnails/production-vs-target-report.jpg',
    name: 'Production vs Target Report',
    description: 'Variance analysis between planned and actual production — for management review meetings.',
    category: 'PRODUCTION',
    tags: ['Target', 'Variance', 'Management'],
    widgets: [
      { id: 'vt1', type: 'kpi', title: 'Target Units', dataField: 'quantity', order: 0, span: 1, color: '#2563eb' },
      { id: 'vt2', type: 'kpi', title: 'Actual Units', dataField: 'total_cost', order: 1, span: 1, color: '#16a34a' },
      { id: 'vt3', type: 'kpi', title: 'Variance %', dataField: 'status', order: 2, span: 1, color: '#dc2626' },
      { id: 'vt4', type: 'line-chart', title: 'Planned vs Actual Trend', dataField: 'quantity', order: 3, span: 2, color: '#2563eb' },
      { id: 'vt5', type: 'bar-chart', title: 'Variance by Product', dataField: 'quantity', groupBy: 'category', order: 4, span: 1, color: '#93c5fd' },
      { id: 'vt6', type: 'table', title: 'Production vs Target Detail', order: 5, span: 3, color: '#2563eb' },
    ] as WidgetConfig[],
  },

  // ─── FINANCE (5) ──────────────────────────────────────────────────────────
  {
    id: 'fin-pl-summary',
    thumbnail: '/thumbnails/monthly-pl-summary.png',
    name: 'Monthly P&L Summary',
    description: 'Revenue, cost, and profit snapshot for CEO and CFO — the top-level financial health report.',
    category: 'FINANCE',
    tags: ['P&L', 'CEO', 'CFO', 'Revenue'],
    widgets: [
      { id: 'pl1', type: 'kpi', title: 'Total Revenue', dataField: 'total_cost', order: 0, span: 1, color: '#16a34a' },
      { id: 'pl2', type: 'kpi', title: 'Total Expenses', dataField: 'unit_cost', order: 1, span: 1, color: '#dc2626' },
      { id: 'pl3', type: 'kpi', title: 'Net Profit', dataField: 'quantity', order: 2, span: 1, color: '#2563eb' },
      { id: 'pl4', type: 'line-chart', title: 'Revenue vs Expense Trend', dataField: 'total_cost', order: 3, span: 2, color: '#16a34a' },
      { id: 'pl5', type: 'pie-chart', title: 'Expense Breakdown', dataField: 'unit_cost', groupBy: 'category', order: 4, span: 1, color: '#86efac' },
      { id: 'pl6', type: 'table', title: 'P&L Statement', order: 5, span: 3, color: '#16a34a' },
    ] as WidgetConfig[],
  },
  {
    id: 'fin-cogs-report',
    thumbnail: '/thumbnails/cogs-report.avif',
    name: 'Cost of Goods Sold (COGS) Report',
    description: 'Breakdown of direct production costs by product and category for finance managers.',
    category: 'FINANCE',
    tags: ['COGS', 'Cost', 'Finance Manager'],
    widgets: [
      { id: 'cg1', type: 'kpi', title: 'Total COGS', dataField: 'total_cost', order: 0, span: 1, color: '#d97706' },
      { id: 'cg2', type: 'kpi', title: 'Avg Cost per Unit', dataField: 'unit_cost', order: 1, span: 1, color: '#d97706' },
      { id: 'cg3', type: 'kpi', title: 'Gross Margin %', dataField: 'quantity', order: 2, span: 1, color: '#16a34a' },
      { id: 'cg4', type: 'bar-chart', title: 'COGS by Product', dataField: 'total_cost', groupBy: 'category', order: 3, span: 2, color: '#d97706' },
      { id: 'cg5', type: 'pie-chart', title: 'Cost Component Share', dataField: 'unit_cost', groupBy: 'supplier', order: 4, span: 1, color: '#fbbf24' },
      { id: 'cg6', type: 'table', title: 'COGS Detail', order: 5, span: 3, color: '#d97706' },
    ] as WidgetConfig[],
  },
  {
    id: 'fin-cash-flow',
    thumbnail: '/thumbnails/cash-flow-dashboard.png',
    name: 'Cash Flow Dashboard',
    description: 'Track cash inflows, outflows, and net position — critical for CFO and directors.',
    category: 'FINANCE',
    tags: ['Cash Flow', 'CFO', 'Liquidity'],
    widgets: [
      { id: 'cf1', type: 'kpi', title: 'Total Inflow', dataField: 'total_cost', order: 0, span: 1, color: '#16a34a' },
      { id: 'cf2', type: 'kpi', title: 'Total Outflow', dataField: 'unit_cost', order: 1, span: 1, color: '#dc2626' },
      { id: 'cf3', type: 'kpi', title: 'Net Cash Position', dataField: 'quantity', order: 2, span: 1, color: '#2563eb' },
      { id: 'cf4', type: 'line-chart', title: 'Cash Flow Trend', dataField: 'total_cost', order: 3, span: 2, color: '#2563eb' },
      { id: 'cf5', type: 'pie-chart', title: 'Outflow by Category', dataField: 'unit_cost', groupBy: 'category', order: 4, span: 1, color: '#93c5fd' },
      { id: 'cf6', type: 'table', title: 'Cash Flow Transactions', order: 5, span: 3, color: '#2563eb' },
    ] as WidgetConfig[],
  },
  {
    id: 'fin-budget-vs-actual',
    thumbnail: '/thumbnails/budget-vs-actual-report.png',
    name: 'Budget vs Actual Report',
    description: 'Department-wise comparison of budgeted vs actual spend for management review.',
    category: 'FINANCE',
    tags: ['Budget', 'Variance', 'Management'],
    widgets: [
      { id: 'ba1', type: 'kpi', title: 'Total Budget', dataField: 'total_cost', order: 0, span: 1, color: '#7c3aed' },
      { id: 'ba2', type: 'kpi', title: 'Actual Spend', dataField: 'unit_cost', order: 1, span: 1, color: '#7c3aed' },
      { id: 'ba3', type: 'kpi', title: 'Over-Budget Depts', dataField: 'status', order: 2, span: 1, color: '#dc2626' },
      { id: 'ba4', type: 'bar-chart', title: 'Budget vs Actual by Dept', dataField: 'total_cost', groupBy: 'category', order: 3, span: 2, color: '#7c3aed' },
      { id: 'ba5', type: 'pie-chart', title: 'Spend Distribution', dataField: 'unit_cost', groupBy: 'supplier', order: 4, span: 1, color: '#c4b5fd' },
      { id: 'ba6', type: 'table', title: 'Budget vs Actual Detail', order: 5, span: 3, color: '#7c3aed' },
    ] as WidgetConfig[],
  },
  {
    id: 'fin-expense-analysis',
    thumbnail: '/thumbnails/expense-analysis-report.jpg',
    name: 'Expense Analysis Report',
    description: 'Categorized expense breakdown with trend analysis for finance teams.',
    category: 'FINANCE',
    tags: ['Expenses', 'Analysis', 'Finance Team'],
    widgets: [
      { id: 'ex1', type: 'kpi', title: 'Total Expenses', dataField: 'total_cost', order: 0, span: 1, color: '#d97706' },
      { id: 'ex2', type: 'kpi', title: 'Largest Expense Category', dataField: 'category', order: 1, span: 1, color: '#d97706' },
      { id: 'ex3', type: 'kpi', title: 'MoM Change %', dataField: 'quantity', order: 2, span: 1, color: '#dc2626' },
      { id: 'ex4', type: 'line-chart', title: 'Expense Trend', dataField: 'total_cost', order: 3, span: 2, color: '#d97706' },
      { id: 'ex5', type: 'pie-chart', title: 'Expense by Category', dataField: 'unit_cost', groupBy: 'category', order: 4, span: 1, color: '#fde68a' },
      { id: 'ex6', type: 'table', title: 'Expense Details', order: 5, span: 3, color: '#d97706' },
    ] as WidgetConfig[],
  },

  // ─── INVENTORY (5) ────────────────────────────────────────────────────────
  {
    id: 'inv-health-monitor',
    thumbnail: '/thumbnails/inventory-health-monitor.jpg',
    name: 'Inventory Health Monitor',
    description: 'Identify stock-outs, overstocks, and reorder points across all warehouses.',
    category: 'INVENTORY',
    tags: ['Stock', 'Warehouse', 'Manager'],
    widgets: [
      { id: 'ih1', type: 'kpi', title: 'Total SKUs', dataField: 'part_number', order: 0, span: 1, color: '#0891b2' },
      { id: 'ih2', type: 'kpi', title: 'Total Qty on Hand', dataField: 'quantity', order: 1, span: 1, color: '#0891b2' },
      { id: 'ih3', type: 'kpi', title: 'Stock Value', dataField: 'total_cost', order: 2, span: 1, color: '#0891b2' },
      { id: 'ih4', type: 'bar-chart', title: 'Stock by Category', dataField: 'quantity', groupBy: 'category', order: 3, span: 2, color: '#0891b2' },
      { id: 'ih5', type: 'pie-chart', title: 'Stock Status Distribution', dataField: 'quantity', groupBy: 'status', order: 4, span: 1, color: '#67e8f9' },
      { id: 'ih6', type: 'table', title: 'Inventory Detail', order: 5, span: 3, color: '#0891b2' },
    ] as WidgetConfig[],
  },
  {
    id: 'inv-stock-aging',
    thumbnail: '/thumbnails/stock-aging-report.png',
    name: 'Stock Aging Report',
    description: 'Identify slow-moving and obsolete inventory by age brackets for inventory managers.',
    category: 'INVENTORY',
    tags: ['Aging', 'Slow-Moving', 'Obsolete'],
    widgets: [
      { id: 'sa1', type: 'kpi', title: 'Items > 90 Days', dataField: 'quantity', order: 0, span: 1, color: '#dc2626' },
      { id: 'sa2', type: 'kpi', title: 'Aging Stock Value', dataField: 'total_cost', order: 1, span: 1, color: '#d97706' },
      { id: 'sa3', type: 'kpi', title: 'Avg Age (Days)', dataField: 'lead_time', order: 2, span: 1, color: '#0891b2' },
      { id: 'sa4', type: 'bar-chart', title: 'Stock by Age Bracket', dataField: 'quantity', groupBy: 'category', order: 3, span: 2, color: '#d97706' },
      { id: 'sa5', type: 'pie-chart', title: 'Age Distribution', dataField: 'quantity', groupBy: 'status', order: 4, span: 1, color: '#fbbf24' },
      { id: 'sa6', type: 'table', title: 'Aged Items List', order: 5, span: 3, color: '#d97706' },
    ] as WidgetConfig[],
  },
  {
    id: 'inv-reorder-level',
    thumbnail: '/thumbnails/reorder-level-dashboard.jpg',
    name: 'Reorder Level Dashboard',
    description: 'Flag items at or below reorder point to prevent production stoppages — for supply chain managers.',
    category: 'INVENTORY',
    tags: ['Reorder', 'Supply Chain', 'Critical Stock'],
    widgets: [
      { id: 'rl1', type: 'kpi', title: 'Items Below Reorder', dataField: 'quantity', order: 0, span: 1, color: '#dc2626' },
      { id: 'rl2', type: 'kpi', title: 'Critical Stock Items', dataField: 'status', order: 1, span: 1, color: '#dc2626' },
      { id: 'rl3', type: 'kpi', title: 'Total Reorder Value', dataField: 'total_cost', order: 2, span: 1, color: '#0891b2' },
      { id: 'rl4', type: 'bar-chart', title: 'Stock Level vs Reorder Point', dataField: 'quantity', groupBy: 'category', order: 3, span: 2, color: '#0891b2' },
      { id: 'rl5', type: 'pie-chart', title: 'Risk Level Breakdown', dataField: 'quantity', groupBy: 'status', order: 4, span: 1, color: '#f87171' },
      { id: 'rl6', type: 'table', title: 'Critical Stock List', order: 5, span: 3, color: '#dc2626' },
    ] as WidgetConfig[],
  },
  {
    id: 'inv-warehouse-util',
    thumbnail: '/thumbnails/warehouse-utilization-report.jpg',
    name: 'Warehouse Utilization Report',
    description: 'Track capacity utilization, overstock zones, and space efficiency across warehouses.',
    category: 'INVENTORY',
    tags: ['Warehouse', 'Capacity', 'Operations'],
    widgets: [
      { id: 'wu1', type: 'kpi', title: 'Overall Utilization %', dataField: 'quantity', order: 0, span: 1, color: '#16a34a' },
      { id: 'wu2', type: 'kpi', title: 'Overstock Locations', dataField: 'status', order: 1, span: 1, color: '#dc2626' },
      { id: 'wu3', type: 'kpi', title: 'Total Locations', dataField: 'part_number', order: 2, span: 1, color: '#16a34a' },
      { id: 'wu4', type: 'bar-chart', title: 'Utilization by Zone', dataField: 'quantity', groupBy: 'category', order: 3, span: 2, color: '#16a34a' },
      { id: 'wu5', type: 'pie-chart', title: 'Zone Status', dataField: 'quantity', groupBy: 'status', order: 4, span: 1, color: '#86efac' },
      { id: 'wu6', type: 'table', title: 'Warehouse Location Detail', order: 5, span: 3, color: '#16a34a' },
    ] as WidgetConfig[],
  },
  {
    id: 'inv-turnover',
    thumbnail: '/thumbnails/inventory-turnover-report.jpg',
    name: 'Inventory Turnover Report',
    description: 'Measure how efficiently inventory is sold and replenished — for CEO and management.',
    category: 'INVENTORY',
    tags: ['Turnover', 'CEO', 'Management', 'Efficiency'],
    widgets: [
      { id: 'it1', type: 'kpi', title: 'Inventory Turnover Ratio', dataField: 'quantity', order: 0, span: 1, color: '#7c3aed' },
      { id: 'it2', type: 'kpi', title: 'Days Sales of Inventory', dataField: 'lead_time', order: 1, span: 1, color: '#7c3aed' },
      { id: 'it3', type: 'kpi', title: 'Slow-Moving Items', dataField: 'status', order: 2, span: 1, color: '#dc2626' },
      { id: 'it4', type: 'line-chart', title: 'Turnover Trend', dataField: 'quantity', order: 3, span: 2, color: '#7c3aed' },
      { id: 'it5', type: 'bar-chart', title: 'Turnover by Category', dataField: 'quantity', groupBy: 'category', order: 4, span: 1, color: '#c4b5fd' },
      { id: 'it6', type: 'table', title: 'Item Turnover Detail', order: 5, span: 3, color: '#7c3aed' },
    ] as WidgetConfig[],
  },

  // ─── PURCHASING (5) ───────────────────────────────────────────────────────
  {
    id: 'pur-po-summary',
    thumbnail: '/thumbnails/purchase-order-summary.png',
    name: 'Purchase Order Summary',
    description: 'Overview of open, pending, and completed POs — for purchase managers.',
    category: 'PURCHASING',
    tags: ['PO', 'Purchase Manager', 'Orders'],
    widgets: [
      { id: 'po1', type: 'kpi', title: 'Total POs Raised', dataField: 'quantity', order: 0, span: 1, color: '#ea580c' },
      { id: 'po2', type: 'kpi', title: 'PO Value (Total)', dataField: 'total_cost', order: 1, span: 1, color: '#ea580c' },
      { id: 'po3', type: 'kpi', title: 'Pending Approvals', dataField: 'status', order: 2, span: 1, color: '#dc2626' },
      { id: 'po4', type: 'bar-chart', title: 'POs by Supplier', dataField: 'quantity', groupBy: 'supplier', order: 3, span: 2, color: '#ea580c' },
      { id: 'po5', type: 'pie-chart', title: 'PO Status Breakdown', dataField: 'quantity', groupBy: 'status', order: 4, span: 1, color: '#fdba74' },
      { id: 'po6', type: 'table', title: 'Purchase Order List', order: 5, span: 3, color: '#ea580c' },
    ] as WidgetConfig[],
  },
  {
    id: 'pur-vendor-performance',
    thumbnail: '/thumbnails/vendor-performance-report.jpg',
    name: 'Vendor Performance Report',
    description: 'Rate suppliers on delivery, quality, and lead time — for procurement managers.',
    category: 'PURCHASING',
    tags: ['Vendor', 'Supplier', 'Procurement'],
    widgets: [
      { id: 'vp1', type: 'kpi', title: 'On-Time Delivery %', dataField: 'status', order: 0, span: 1, color: '#16a34a' },
      { id: 'vp2', type: 'kpi', title: 'Avg Lead Time (Days)', dataField: 'lead_time', order: 1, span: 1, color: '#d97706' },
      { id: 'vp3', type: 'kpi', title: 'Rejection Rate %', dataField: 'quantity', order: 2, span: 1, color: '#dc2626' },
      { id: 'vp4', type: 'bar-chart', title: 'Delivery Performance by Vendor', dataField: 'quantity', groupBy: 'supplier', order: 3, span: 2, color: '#ea580c' },
      { id: 'vp5', type: 'pie-chart', title: 'Vendor Quality Share', dataField: 'total_cost', groupBy: 'supplier', order: 4, span: 1, color: '#fdba74' },
      { id: 'vp6', type: 'table', title: 'Vendor Scorecard', order: 5, span: 3, color: '#ea580c' },
    ] as WidgetConfig[],
  },
  {
    id: 'pur-spend-analysis',
    thumbnail: '/thumbnails/spend-analysis-dashboard.png',
    name: 'Spend Analysis Dashboard',
    description: 'Category-wise procurement spend with savings opportunities — for CFO and management.',
    category: 'PURCHASING',
    tags: ['Spend', 'CFO', 'Management', 'Savings'],
    widgets: [
      { id: 'sp1', type: 'kpi', title: 'Total Procurement Spend', dataField: 'total_cost', order: 0, span: 1, color: '#d97706' },
      { id: 'sp2', type: 'kpi', title: 'Top Spend Category', dataField: 'category', order: 1, span: 1, color: '#d97706' },
      { id: 'sp3', type: 'kpi', title: 'Savings Identified', dataField: 'unit_cost', order: 2, span: 1, color: '#16a34a' },
      { id: 'sp4', type: 'bar-chart', title: 'Spend by Category', dataField: 'total_cost', groupBy: 'category', order: 3, span: 2, color: '#d97706' },
      { id: 'sp5', type: 'pie-chart', title: 'Top Vendor Share', dataField: 'total_cost', groupBy: 'supplier', order: 4, span: 1, color: '#fbbf24' },
      { id: 'sp6', type: 'table', title: 'Spend Detail', order: 5, span: 3, color: '#d97706' },
    ] as WidgetConfig[],
  },
  {
    id: 'pur-vs-budget',
    thumbnail: '/thumbnails/purchase-vs-budget-report.jpg',
    name: 'Purchase vs Budget Report',
    description: 'Compare actual purchase spend against approved budget by department.',
    category: 'PURCHASING',
    tags: ['Budget', 'Finance', 'Variance', 'Directors'],
    widgets: [
      { id: 'pb1', type: 'kpi', title: 'Approved Budget', dataField: 'total_cost', order: 0, span: 1, color: '#7c3aed' },
      { id: 'pb2', type: 'kpi', title: 'Actual Purchase Spend', dataField: 'unit_cost', order: 1, span: 1, color: '#ea580c' },
      { id: 'pb3', type: 'kpi', title: 'Over-Spend Depts', dataField: 'status', order: 2, span: 1, color: '#dc2626' },
      { id: 'pb4', type: 'bar-chart', title: 'Budget vs Actual by Dept', dataField: 'total_cost', groupBy: 'category', order: 3, span: 2, color: '#ea580c' },
      { id: 'pb5', type: 'pie-chart', title: 'Purchase Category Mix', dataField: 'unit_cost', groupBy: 'category', order: 4, span: 1, color: '#fdba74' },
      { id: 'pb6', type: 'table', title: 'Purchase vs Budget Detail', order: 5, span: 3, color: '#ea580c' },
    ] as WidgetConfig[],
  },
  {
    id: 'pur-lead-time',
    thumbnail: '/thumbnails/supplier-lead-time-report.png',
    name: 'Supplier Lead Time Report',
    description: 'Analyze supplier lead times and delays to improve procurement planning.',
    category: 'PURCHASING',
    tags: ['Lead Time', 'Delay', 'Supply Chain'],
    widgets: [
      { id: 'lt1', type: 'kpi', title: 'Avg Lead Time (Days)', dataField: 'lead_time', order: 0, span: 1, color: '#0891b2' },
      { id: 'lt2', type: 'kpi', title: 'Delayed Deliveries', dataField: 'status', order: 1, span: 1, color: '#dc2626' },
      { id: 'lt3', type: 'kpi', title: 'On-Time Rate %', dataField: 'quantity', order: 2, span: 1, color: '#16a34a' },
      { id: 'lt4', type: 'bar-chart', title: 'Lead Time by Supplier', dataField: 'lead_time', groupBy: 'supplier', order: 3, span: 2, color: '#0891b2' },
      { id: 'lt5', type: 'pie-chart', title: 'Delivery Status', dataField: 'quantity', groupBy: 'status', order: 4, span: 1, color: '#67e8f9' },
      { id: 'lt6', type: 'table', title: 'Lead Time Detail', order: 5, span: 3, color: '#0891b2' },
    ] as WidgetConfig[],
  },

  // ─── QUALITY (5) ──────────────────────────────────────────────────────────
  {
    id: 'qual-control-dashboard',
    thumbnail: '/thumbnails/quality-control-dashboard.jpg',
    name: 'Quality Control Dashboard',
    description: 'Monitor defect rates, inspection results, and corrective actions in real time.',
    category: 'QUALITY',
    tags: ['QC', 'Defects', 'Inspection', 'Manager'],
    widgets: [
      { id: 'qc1', type: 'kpi', title: 'Pass Rate %', dataField: 'status', order: 0, span: 1, color: '#16a34a' },
      { id: 'qc2', type: 'kpi', title: 'Defects Found', dataField: 'quantity', order: 1, span: 1, color: '#dc2626' },
      { id: 'qc3', type: 'kpi', title: 'Inspections Done', dataField: 'total_cost', order: 2, span: 1, color: '#2563eb' },
      { id: 'qc4', type: 'line-chart', title: 'Defect Rate Trend', dataField: 'quantity', order: 3, span: 2, color: '#dc2626' },
      { id: 'qc5', type: 'pie-chart', title: 'Defect Categories', dataField: 'quantity', groupBy: 'category', order: 4, span: 1, color: '#f87171' },
      { id: 'qc6', type: 'table', title: 'Inspection Records', order: 5, span: 3, color: '#dc2626' },
    ] as WidgetConfig[],
  },
  {
    id: 'qual-defect-analysis',
    thumbnail: '/thumbnails/defect-analysis-report.png',
    name: 'Defect Analysis Report',
    description: 'Root-cause analysis of defects by type, product, and production line — for quality directors.',
    category: 'QUALITY',
    tags: ['Defect', 'Root Cause', 'Quality Director'],
    widgets: [
      { id: 'da1', type: 'kpi', title: 'Total Defects', dataField: 'quantity', order: 0, span: 1, color: '#dc2626' },
      { id: 'da2', type: 'kpi', title: 'Top Defect Type', dataField: 'category', order: 1, span: 1, color: '#dc2626' },
      { id: 'da3', type: 'kpi', title: 'Defect Cost (Rework)', dataField: 'total_cost', order: 2, span: 1, color: '#d97706' },
      { id: 'da4', type: 'bar-chart', title: 'Defects by Product', dataField: 'quantity', groupBy: 'part_number', order: 3, span: 2, color: '#dc2626' },
      { id: 'da5', type: 'pie-chart', title: 'Defect Type Breakdown', dataField: 'quantity', groupBy: 'category', order: 4, span: 1, color: '#fca5a5' },
      { id: 'da6', type: 'table', title: 'Defect Log', order: 5, span: 3, color: '#dc2626' },
    ] as WidgetConfig[],
  },
  {
    id: 'qual-first-pass-yield',
    thumbnail: '/thumbnails/first-pass-yield-report.png',
    name: 'First Pass Yield Report',
    description: 'Measure units passing quality without rework on the first attempt — for production and QC managers.',
    category: 'QUALITY',
    tags: ['FPY', 'Yield', 'Rework', 'Production'],
    widgets: [
      { id: 'fp1', type: 'kpi', title: 'Overall FPY %', dataField: 'quantity', order: 0, span: 1, color: '#16a34a' },
      { id: 'fp2', type: 'kpi', title: 'Units Reworked', dataField: 'status', order: 1, span: 1, color: '#d97706' },
      { id: 'fp3', type: 'kpi', title: 'Rework Cost', dataField: 'total_cost', order: 2, span: 1, color: '#dc2626' },
      { id: 'fp4', type: 'bar-chart', title: 'FPY by Product Line', dataField: 'quantity', groupBy: 'category', order: 3, span: 2, color: '#16a34a' },
      { id: 'fp5', type: 'pie-chart', title: 'Pass / Rework / Reject', dataField: 'quantity', groupBy: 'status', order: 4, span: 1, color: '#86efac' },
      { id: 'fp6', type: 'table', title: 'FPY Detail', order: 5, span: 3, color: '#16a34a' },
    ] as WidgetConfig[],
  },
  {
    id: 'qual-complaint-report',
    thumbnail: '/thumbnails/customer-complaint-report.jpg',
    name: 'Customer Complaint Report',
    description: 'Track customer complaints by category, product, and resolution status — for management and CEO.',
    category: 'QUALITY',
    tags: ['Complaints', 'Customer', 'CEO', 'Management'],
    widgets: [
      { id: 'cr1', type: 'kpi', title: 'Total Complaints', dataField: 'quantity', order: 0, span: 1, color: '#dc2626' },
      { id: 'cr2', type: 'kpi', title: 'Resolved', dataField: 'status', order: 1, span: 1, color: '#16a34a' },
      { id: 'cr3', type: 'kpi', title: 'Avg Resolution Days', dataField: 'lead_time', order: 2, span: 1, color: '#d97706' },
      { id: 'cr4', type: 'line-chart', title: 'Complaint Trend', dataField: 'quantity', order: 3, span: 2, color: '#dc2626' },
      { id: 'cr5', type: 'pie-chart', title: 'Complaint by Category', dataField: 'quantity', groupBy: 'category', order: 4, span: 1, color: '#fca5a5' },
      { id: 'cr6', type: 'table', title: 'Complaint Log', order: 5, span: 3, color: '#dc2626' },
    ] as WidgetConfig[],
  },
  {
    id: 'qual-inspection-summary',
    thumbnail: '/thumbnails/inspection-summary-report.jpg',
    name: 'Inspection Summary Report',
    description: 'Aggregate view of all inspections — passed, failed, and pending — for QC teams.',
    category: 'QUALITY',
    tags: ['Inspection', 'QC Team', 'Summary'],
    widgets: [
      { id: 'is1', type: 'kpi', title: 'Total Inspected', dataField: 'quantity', order: 0, span: 1, color: '#2563eb' },
      { id: 'is2', type: 'kpi', title: 'Passed', dataField: 'status', order: 1, span: 1, color: '#16a34a' },
      { id: 'is3', type: 'kpi', title: 'Failed / Rejected', dataField: 'total_cost', order: 2, span: 1, color: '#dc2626' },
      { id: 'is4', type: 'bar-chart', title: 'Inspections by Line', dataField: 'quantity', groupBy: 'category', order: 3, span: 2, color: '#2563eb' },
      { id: 'is5', type: 'pie-chart', title: 'Pass / Fail Ratio', dataField: 'quantity', groupBy: 'status', order: 4, span: 1, color: '#93c5fd' },
      { id: 'is6', type: 'table', title: 'Inspection Detail', order: 5, span: 3, color: '#2563eb' },
    ] as WidgetConfig[],
  },

  // ─── BOM (5) ──────────────────────────────────────────────────────────────
  {
    id: 'bom-cost-breakdown',
    thumbnail: '/thumbnails/bom-cost-breakdown.png',
    name: 'BOM Cost Breakdown',
    description: 'Drill into component costs, material cost share, and cost optimization opportunities — for CFO and cost accountants.',
    category: 'BOM',
    tags: ['BOM', 'Cost', 'CFO', 'Costing'],
    widgets: [
      { id: 'bc1', type: 'kpi', title: 'Total BOM Cost', dataField: 'total_cost', order: 0, span: 1, color: '#4f46e5' },
      { id: 'bc2', type: 'kpi', title: 'Total Components', dataField: 'quantity', order: 1, span: 1, color: '#4f46e5' },
      { id: 'bc3', type: 'kpi', title: 'Highest Cost Item', dataField: 'unit_cost', order: 2, span: 1, color: '#dc2626' },
      { id: 'bc4', type: 'pie-chart', title: 'Cost by Component Category', dataField: 'unit_cost', groupBy: 'category', order: 3, span: 2, color: '#4f46e5' },
      { id: 'bc5', type: 'bar-chart', title: 'Top 10 Costly Components', dataField: 'total_cost', groupBy: 'part_number', order: 4, span: 1, color: '#818cf8' },
      { id: 'bc6', type: 'table', title: 'BOM Cost Detail', order: 5, span: 3, color: '#4f46e5' },
    ] as WidgetConfig[],
  },
  {
    id: 'bom-vs-actual',
    thumbnail: '/thumbnails/bom-vs-actual-consumption.png',
    name: 'BOM vs Actual Consumption',
    description: 'Compare standard BOM quantities against actual material consumed in production.',
    category: 'BOM',
    tags: ['BOM', 'Variance', 'Consumption', 'Production Manager'],
    widgets: [
      { id: 'bv1', type: 'kpi', title: 'BOM Qty (Planned)', dataField: 'quantity', order: 0, span: 1, color: '#4f46e5' },
      { id: 'bv2', type: 'kpi', title: 'Actual Qty Consumed', dataField: 'total_cost', order: 1, span: 1, color: '#ea580c' },
      { id: 'bv3', type: 'kpi', title: 'Variance %', dataField: 'status', order: 2, span: 1, color: '#dc2626' },
      { id: 'bv4', type: 'bar-chart', title: 'BOM vs Actual by Component', dataField: 'quantity', groupBy: 'part_number', order: 3, span: 2, color: '#4f46e5' },
      { id: 'bv5', type: 'pie-chart', title: 'Over / Under Consumption', dataField: 'quantity', groupBy: 'status', order: 4, span: 1, color: '#a5b4fc' },
      { id: 'bv6', type: 'table', title: 'BOM vs Actual Detail', order: 5, span: 3, color: '#4f46e5' },
    ] as WidgetConfig[],
  },
  {
    id: 'bom-component-availability',
    thumbnail: '/thumbnails/component-availability-report.png',
    name: 'Component Availability Report',
    description: 'Check which BOM components are available, short, or on order before production starts.',
    category: 'BOM',
    tags: ['BOM', 'Availability', 'Supply Chain', 'Shortage'],
    widgets: [
      { id: 'ca1', type: 'kpi', title: 'Components Available', dataField: 'quantity', order: 0, span: 1, color: '#16a34a' },
      { id: 'ca2', type: 'kpi', title: 'Short / Missing', dataField: 'status', order: 1, span: 1, color: '#dc2626' },
      { id: 'ca3', type: 'kpi', title: 'On Order', dataField: 'lead_time', order: 2, span: 1, color: '#d97706' },
      { id: 'ca4', type: 'bar-chart', title: 'Availability by Supplier', dataField: 'quantity', groupBy: 'supplier', order: 3, span: 2, color: '#4f46e5' },
      { id: 'ca5', type: 'pie-chart', title: 'Component Status', dataField: 'quantity', groupBy: 'status', order: 4, span: 1, color: '#a5b4fc' },
      { id: 'ca6', type: 'table', title: 'Component Status List', order: 5, span: 3, color: '#4f46e5' },
    ] as WidgetConfig[],
  },
  {
    id: 'bom-multi-level',
    thumbnail: '/thumbnails/multi-level-bom-summary.png',
    name: 'Multi-level BOM Summary',
    description: 'Overview of finished goods, sub-assemblies, and raw materials across all BOM levels.',
    category: 'BOM',
    tags: ['BOM', 'Multi-level', 'Engineering', 'Management'],
    widgets: [
      { id: 'ml1', type: 'kpi', title: 'Finished Goods', dataField: 'finished_good', order: 0, span: 1, color: '#4f46e5' },
      { id: 'ml2', type: 'kpi', title: 'Sub-Assemblies', dataField: 'assembly', order: 1, span: 1, color: '#7c3aed' },
      { id: 'ml3', type: 'kpi', title: 'Raw Materials', dataField: 'quantity', order: 2, span: 1, color: '#0891b2' },
      { id: 'ml4', type: 'bar-chart', title: 'BOM Items by Level', dataField: 'quantity', groupBy: 'level', order: 3, span: 2, color: '#4f46e5' },
      { id: 'ml5', type: 'pie-chart', title: 'Material Type Mix', dataField: 'quantity', groupBy: 'category', order: 4, span: 1, color: '#a5b4fc' },
      { id: 'ml6', type: 'table', title: 'Multi-level BOM Detail', order: 5, span: 3, color: '#4f46e5' },
    ] as WidgetConfig[],
  },
  {
    id: 'bom-revision-history',
    thumbnail: '/thumbnails/bom-revision-history.jpg',
    name: 'BOM Revision History',
    description: 'Audit trail of all BOM changes by version, component, and approver — for quality and engineering.',
    category: 'BOM',
    tags: ['BOM', 'Revision', 'Audit', 'Engineering', 'Quality'],
    widgets: [
      { id: 'rh1', type: 'kpi', title: 'Total Revisions', dataField: 'quantity', order: 0, span: 1, color: '#4f46e5' },
      { id: 'rh2', type: 'kpi', title: 'Active BOM Version', dataField: 'level', order: 1, span: 1, color: '#4f46e5' },
      { id: 'rh3', type: 'kpi', title: 'Pending Approvals', dataField: 'status', order: 2, span: 1, color: '#dc2626' },
      { id: 'rh4', type: 'line-chart', title: 'Revision Frequency Trend', dataField: 'quantity', order: 3, span: 2, color: '#4f46e5' },
      { id: 'rh5', type: 'pie-chart', title: 'Change Type Distribution', dataField: 'quantity', groupBy: 'category', order: 4, span: 1, color: '#a5b4fc' },
      { id: 'rh6', type: 'table', title: 'Revision Log', order: 5, span: 3, color: '#4f46e5' },
    ] as WidgetConfig[],
  },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Templates() {
  const { favoriteTemplates, toggleFavorite, loadTemplate, showToast } = useStore()
  const navigate = useNavigate()
  const [search, setSearch]       = useState('')
  const [activeTab, setActiveTab] = useState('ALL')
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())

  const toggleTag = (id: string) =>
    setActiveTags(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const matchesTag = (t: Template, tagId: string): boolean => {
    if (tagId === 'SALES') return t.tags.some(tag => SALES_KEYWORDS.has(tag))
    return t.category === tagId
  }

  const filtered = TEMPLATES.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || t.name.toLowerCase().includes(q)
      || t.tags.some(tag => tag.toLowerCase().includes(q))
    const matchTab =
      activeTab === 'ALL'
      || (activeTab === 'FAVORITES'   && favoriteTemplates.has(t.id))
      || (activeTab === 'RECOMMENDED' && RECOMMENDED_IDS.includes(t.id))
    const matchTags = activeTags.size === 0
      || Array.from(activeTags).some(tagId => matchesTag(t, tagId))
    return matchSearch && matchTab && matchTags
  })

  const handleUse = (template: Template) => {
    loadTemplate(template.widgets, template.name)
    showToast(`"${template.name}" loaded into Builder`, 'success')
    navigate('/builder')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top bar: title + search ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Template Gallery</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {filtered.length === TEMPLATES.length
              ? `${TEMPLATES.length} templates · 6 departments · apply in one click`
              : `${filtered.length} of ${TEMPLATES.length} templates`}
          </p>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or tag…"
            className="pl-8 pr-8 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 w-60"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ── Category tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1.5 px-5 pb-3 shrink-0 overflow-x-auto scrollbar-none">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          const badge =
            tab.id === 'FAVORITES'   ? favoriteTemplates.size :
            tab.id === 'RECOMMENDED' ? RECOMMENDED_IDS.length : null
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {badge !== null && badge > 0 && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-slate-500'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Multi-select filter tags ────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-5 pb-3 shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Filter:</span>
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TAGS.map(tag => {
            const isActive = activeTags.has(tag.id)
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                  isActive
                    ? 'border-transparent text-white shadow-sm'
                    : 'border-gray-200 bg-white text-slate-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
                style={isActive ? { background: tag.color } : {}}
              >
                {tag.label}
                {isActive && <X size={9} className="opacity-80" />}
              </button>
            )
          })}
          {activeTags.size > 0 && (
            <button
              onClick={() => setActiveTags(new Set())}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-gray-400 hover:text-gray-700 border border-dashed border-gray-300 hover:border-gray-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Card grid ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-5 pb-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Search size={28} className="opacity-25 mb-3" />
            <p className="text-sm font-semibold">No templates found</p>
            <p className="text-xs mt-1">
              {activeTab === 'FAVORITES'
                ? 'Click ★ on any card to save it here'
                : activeTags.size > 0
                ? 'Try removing some filters or clearing the search'
                : 'Try a different search or category'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map(t => (
              <TemplateGalleryCard
                key={t.id}
                template={t}
                isFavorite={favoriteTemplates.has(t.id)}
                onFavorite={() => toggleFavorite(t.id)}
                onView={() => navigate(`/templates/${t.id}`)}
                onUse={() => handleUse(t)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
