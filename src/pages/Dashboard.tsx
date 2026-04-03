import {
  AlertTriangle, ArrowUpRight, BarChart2, CheckCircle,
  CheckCircle2, Database, FileText, Info, Layers,
  Plus, Sparkles, Upload, XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useStore } from '../store/useStore'

const DEPT_NAMES = ['Purchasing', 'Production', 'Quality', 'Logistics', 'Sales', 'Finance']

function relativeTime(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Dashboard() {
  const { uploads, archivedReports, canvasWidgets, templatesUsed } = useStore()
  const navigate = useNavigate()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // ── Real KPI data ──────────────────────────────────────────────────────────
  const readyUploads = uploads.filter(u => u.standardizedRows.length > 0).length

  const kpis = [
    { label: 'Saved Reports',  value: archivedReports.length, icon: <FileText size={15} />,  color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Files Uploaded', value: uploads.length,         icon: <Database size={15} />,  color: '#10b981', bg: '#ecfdf5' },
    { label: 'Widgets Built',  value: canvasWidgets.length,   icon: <BarChart2 size={15} />, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Templates Used', value: templatesUsed,          icon: <Layers size={15} />,    color: '#f59e0b', bg: '#fffbeb' },
  ]

  // ── Reports by department (real) ───────────────────────────────────────────
  const deptData = DEPT_NAMES
    .map(dept => ({ dept: dept.slice(0, 4), count: archivedReports.filter(r => r.department === dept).length }))
    .filter(d => d.count > 0)

  // ── Real alerts ────────────────────────────────────────────────────────────
  type AlertItem = { type: 'error' | 'warning' | 'info'; message: string; actionLabel: string; actionPath: string }
  const realAlerts: AlertItem[] = []

  uploads.filter(u => u.status === 'ERROR').forEach(u => {
    realAlerts.push({ type: 'error', message: `"${u.name}" failed to process`, actionLabel: 'Re-upload', actionPath: '/' })
  })

  const unmapped = uploads.filter(u => u.standardizedRows.length === 0 && u.status !== 'ERROR')
  if (unmapped.length > 0) {
    realAlerts.push({ type: 'warning', message: `${unmapped.length} file(s) need column mapping`, actionLabel: 'Map Now', actionPath: '/' })
  }

  if (canvasWidgets.length > 0 && archivedReports.length === 0) {
    realAlerts.push({ type: 'info', message: 'You have unsaved widgets on the canvas', actionLabel: 'Save Report', actionPath: '/builder' })
  }

  // ── Recent reports (already real) ─────────────────────────────────────────
  const recentReports = [...archivedReports]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

  const errorCount = realAlerts.filter(a => a.type === 'error').length

  return (
    <div className="p-5 max-w-screen-xl space-y-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between fade-up">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{greeting}</p>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Executive Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
          >
            <Plus size={12} /> New Report
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-slate-600 bg-white hover:bg-gray-50"
          >
            <Upload size={12} /> Upload
          </button>
          <button
            onClick={() => navigate('/templates')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-slate-600 bg-white hover:bg-gray-50"
          >
            <Layers size={12} /> Templates
          </button>
        </div>
      </div>

      {/* ── KPI Cards (4 real) ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <div
            key={k.label}
            className="bg-white rounded-xl p-4 border border-gray-100 fade-up"
            style={{ boxShadow: '0 1px 4px rgba(30,60,120,0.06)', animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: k.bg, color: k.color }}>
                {k.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{k.value}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Middle Row: Dept Chart + Alerts ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Reports by Department (real) */}
        <div
          className="col-span-2 bg-white rounded-xl p-4 border border-gray-100 fade-up"
          style={{ boxShadow: '0 1px 4px rgba(30,60,120,0.06)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-800">Reports by Department</p>
              <p className="text-[10px] text-slate-400">Saved to archive</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">{archivedReports.length} total</span>
          </div>

          {deptData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[150px] text-center">
              <BarChart2 size={28} className="text-gray-200 mb-2" />
              <p className="text-xs text-slate-400 font-medium">No reports saved yet</p>
              <p className="text-[10px] text-slate-300 mt-0.5">Build a report and save it to Archive</p>
              <button
                onClick={() => navigate('/builder')}
                className="mt-3 px-3 py-1.5 text-[10px] font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Open Builder →
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={deptData} margin={{ top: 2, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dept" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [v, 'Reports']}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Alerts (computed from real state) */}
        <div
          className="bg-white rounded-xl p-4 border border-gray-100 fade-up"
          style={{ boxShadow: '0 1px 4px rgba(30,60,120,0.06)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-800">Alerts</p>
            {errorCount > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">
                {errorCount} Error{errorCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {realAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[120px] text-center">
              <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                <CheckCircle size={16} className="text-emerald-500" />
              </div>
              <p className="text-[11px] font-semibold text-slate-600">All good</p>
              <p className="text-[10px] text-slate-400 mt-0.5">No issues detected</p>
            </div>
          ) : (
            <div className="space-y-2">
              {realAlerts.map((a, i) => (
                <div
                  key={i}
                  className={`flex gap-2 p-2 rounded-lg ${
                    a.type === 'error' ? 'bg-red-50' : a.type === 'warning' ? 'bg-amber-50' : 'bg-blue-50'
                  }`}
                >
                  {a.type === 'error'
                    ? <XCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                    : a.type === 'warning'
                    ? <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                    : <Info size={12} className="text-blue-500 mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-slate-700 leading-snug">{a.message}</p>
                    <button
                      onClick={() => navigate(a.actionPath)}
                      className={`text-[9px] font-semibold mt-0.5 ${
                        a.type === 'error' ? 'text-red-500' : a.type === 'warning' ? 'text-amber-600' : 'text-blue-500'
                      } hover:underline`}
                    >
                      {a.actionLabel} →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Recent Reports (real) */}
        <div
          className="bg-white rounded-xl p-4 border border-gray-100 fade-up"
          style={{ boxShadow: '0 1px 4px rgba(30,60,120,0.06)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-800">Recent Reports</p>
            <button onClick={() => navigate('/archive')} className="text-[10px] text-blue-500 font-medium flex items-center gap-0.5 hover:text-blue-600">
              All <ArrowUpRight size={10} />
            </button>
          </div>
          {recentReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[110px] text-center">
              <FileText size={24} className="text-gray-200 mb-2" />
              <p className="text-[11px] font-medium text-slate-400">No reports saved yet</p>
              <button
                onClick={() => navigate('/builder')}
                className="mt-2 text-[10px] font-semibold text-blue-500 hover:underline"
              >
                Build one →
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentReports.map(r => (
                <div key={r.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <FileText size={12} className="text-blue-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-700 truncate">{r.title}</p>
                    <p className="text-[9px] text-slate-400">{r.department} · {relativeTime(r.createdAt)}</p>
                  </div>
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                    style={r.source === 'ai' ? { background: '#f5f3ff', color: '#7c3aed' } : { background: '#eff6ff', color: '#1d4ed8' }}
                  >
                    {r.source === 'ai' ? 'AI' : 'Builder'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Sources — real uploads */}
        <div
          className="bg-white rounded-xl p-4 border border-gray-100 fade-up"
          style={{ boxShadow: '0 1px 4px rgba(30,60,120,0.06)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-800">Uploaded Files</p>
            {uploads.length > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                {readyUploads} Ready
              </span>
            )}
          </div>

          {uploads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[110px] text-center">
              <Database size={24} className="text-gray-200 mb-2" />
              <p className="text-[11px] font-medium text-slate-400">No files uploaded yet</p>
              <button
                onClick={() => navigate('/')}
                className="mt-2 text-[10px] font-semibold text-blue-500 hover:underline"
              >
                Upload a file →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {uploads.slice(0, 4).map(u => {
                const ready = u.standardizedRows.length > 0
                const failed = u.status === 'ERROR'
                return (
                  <div key={u.id} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${failed ? 'bg-red-400' : ready ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700 truncate">{u.name}</p>
                      <p className="text-[9px] text-slate-400">{u.rows.length.toLocaleString()} rows</p>
                    </div>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                      failed ? 'bg-red-50 text-red-500' : ready ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {failed ? 'Error' : ready ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                )
              })}
              {uploads.length > 4 && (
                <p className="text-[10px] text-slate-400 text-center pt-1">+{uploads.length - 4} more</p>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions + workspace summary (unchanged — already real) */}
        <div
          className="bg-white rounded-xl p-4 border border-gray-100 fade-up"
          style={{ boxShadow: '0 1px 4px rgba(30,60,120,0.06)' }}
        >
          <p className="text-xs font-semibold text-slate-800 mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'New Report',  icon: <Plus size={13} />,      onClick: () => navigate('/'),            g: 'linear-gradient(135deg,#3b82f6,#6366f1)' },
              { label: 'Templates',   icon: <Layers size={13} />,    onClick: () => navigate('/templates'),   g: 'linear-gradient(135deg,#8b5cf6,#ec4899)' },
              { label: 'Builder',     icon: <BarChart2 size={13} />, onClick: () => navigate('/builder'),     g: 'linear-gradient(135deg,#10b981,#0891b2)' },
              { label: 'AI Insights', icon: <Sparkles size={13} />,  onClick: () => navigate('/ai-insights'), g: 'linear-gradient(135deg,#f59e0b,#ef4444)'  },
            ].map(a => (
              <button
                key={a.label}
                onClick={a.onClick}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-100 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0" style={{ background: a.g }}>
                  {a.icon}
                </div>
                <span className="text-[10px] font-semibold text-slate-700">{a.label}</span>
              </button>
            ))}
          </div>

          <div className="rounded-lg px-3 py-2 space-y-1" style={{ background: '#f8fafc' }}>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Workspace</p>
            {[
              [`${uploads.length} file${uploads.length !== 1 ? 's' : ''} uploaded`,          <CheckCircle2 size={10} className="text-emerald-400" />],
              [`${canvasWidgets.length} widget${canvasWidgets.length !== 1 ? 's' : ''} on canvas`, <BarChart2 size={10} className="text-blue-400" />],
              [`${templatesUsed} template${templatesUsed !== 1 ? 's' : ''} used`,              <Layers size={10} className="text-purple-400" />],
            ].map(([label, icon], i) => (
              <div key={i} className="flex items-center gap-1.5">
                {icon as React.ReactNode}
                <span className="text-[10px] text-slate-500">{label as string}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
