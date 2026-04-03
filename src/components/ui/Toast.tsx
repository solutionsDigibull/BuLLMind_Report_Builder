import { CheckCircle, Info, X, XCircle } from 'lucide-react'
import { useStore } from '../../store/useStore'

export default function Toast() {
  const { toast, clearToast } = useStore()
  if (!toast) return null

  const config = {
    success: {
      icon: <CheckCircle size={15} />,
      iconColor: '#10b981',
      bar: '#10b981',
    },
    error: {
      icon: <XCircle size={15} />,
      iconColor: '#ef4444',
      bar: '#ef4444',
    },
    info: {
      icon: <Info size={15} />,
      iconColor: '#3b82f6',
      bar: '#3b82f6',
    },
  }

  const c = config[toast.type]

  return (
    <div
      className="fixed bottom-6 right-6 z-50 fade-up"
      style={{ maxWidth: '360px' }}
    >
      <div
        className="flex items-start gap-3 px-4 py-3.5 rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid rgba(226,232,240,0.8)',
        }}
      >
        {/* Colored left bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ background: c.bar }}
        />

        <span style={{ color: c.iconColor, marginTop: '1px' }}>{c.icon}</span>
        <p className="text-xs font-medium text-slate-700 flex-1 leading-relaxed">{toast.message}</p>
        <button
          onClick={clearToast}
          className="w-5 h-5 flex items-center justify-center rounded-md transition-colors shrink-0 mt-0.5"
          style={{ color: '#94a3b8' }}
          onMouseEnter={e => e.currentTarget.style.color = '#475569'}
          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}
