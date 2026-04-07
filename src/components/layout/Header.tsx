import {
  Bell, Check, ChevronRight, FileText, HelpCircle, LayoutDashboard,
  LayoutTemplate, Link, LogOut, Moon, Palette, Search, Settings, Shield,
  Sun, User, X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { TEMPLATES } from '../../pages/Templates'
import { useStore } from '../../store/useStore'


const NOTIFICATIONS = [
  { id: 1, icon: '📊', title: 'Report ready', body: 'Production Q1 report has been processed.', time: '2m ago', read: false },
  { id: 2, icon: '✅', title: 'Template loaded', body: 'BOM Cost Breakdown loaded into Builder.', time: '14m ago', read: false },
  { id: 3, icon: '📁', title: 'File uploaded', body: 'sales_data_march.csv — 1,240 rows ready.', time: '1h ago', read: true },
  { id: 4, icon: '🤖', title: 'AI Insight generated', body: 'Purchase variance analysis complete.', time: '3h ago', read: true },
]

// ── Dropdown shell ───────────────────────────────────────────────────────────
function Dropdown({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="absolute top-full right-0 mt-2 z-50 fade-up"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
        transition: 'background 0.25s ease',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── Notifications panel ──────────────────────────────────────────────────────
function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState(NOTIFICATIONS)
  const unread = items.filter(n => !n.read).length

  const markAll = () => setItems(prev => prev.map(n => ({ ...n, read: true })))
  const dismiss = (id: number) => setItems(prev => prev.filter(n => n.id !== id))

  return (
    <Dropdown style={{ width: '320px' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(196,210,235,0.5)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: '#1e293b' }}>Notifications</span>
          {unread > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#4f8ef7' }}>
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button onClick={markAll} className="text-[11px] font-medium px-2 py-1 rounded-lg transition-colors" style={{ color: '#4f8ef7' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,142,247,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors" style={{ color: '#94a3b8' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto scrollbar-light">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell size={24} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
            <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>All caught up!</p>
          </div>
        ) : (
          items.map(n => (
            <div
              key={n.id}
              className="flex items-start gap-3 px-4 py-3 transition-colors cursor-default"
              style={{ borderBottom: '1px solid rgba(196,210,235,0.3)', background: n.read ? 'transparent' : 'rgba(79,142,247,0.04)' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(79,142,247,0.04)'}
            >
              <span className="text-base shrink-0 mt-0.5">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold" style={{ color: '#1e293b' }}>{n.title}</p>
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#4f8ef7' }} />}
                </div>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>{n.body}</p>
                <p className="text-[10px] mt-1 font-medium" style={{ color: '#94a3b8' }}>{n.time}</p>
              </div>
              <button onClick={() => dismiss(n.id)} className="w-5 h-5 flex items-center justify-center rounded shrink-0 transition-colors mt-0.5" style={{ color: '#cbd5e1' }}
                onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
              >
                <X size={11} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2.5" style={{ borderTop: '1px solid rgba(196,210,235,0.5)' }}>
        <button className="w-full text-[11px] font-semibold text-center py-1 rounded-lg transition-colors" style={{ color: '#4f8ef7' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,142,247,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          View all notifications
        </button>
      </div>
    </Dropdown>
  )
}

// ── Settings panel ───────────────────────────────────────────────────────────
function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { theme, setTheme } = useStore()
  const [accentColor, setAccentColor] = useState('#4f8ef7')
  const [notifications, setNotifications] = useState(true)

  const ACCENTS = ['#4f8ef7', '#7c5cfc', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

  const THEME_OPTIONS: { value: 'light' | 'dark' | 'system'; label: string; icon: React.ReactNode }[] = [
    { value: 'light',  label: 'Light',  icon: <Sun size={12} /> },
    { value: 'dark',   label: 'Dark',   icon: <Moon size={12} /> },
    { value: 'system', label: 'System', icon: <Settings size={12} /> },
  ]

  return (
    <Dropdown style={{ width: '288px' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Settings</span>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <X size={13} />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Theme */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Appearance</p>
          <div className="flex gap-1.5">
            {THEME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={theme === opt.value
                  ? { background: 'linear-gradient(135deg,#4f8ef7,#7c5cfc)', color: 'white' }
                  : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                }
              >
                {opt.icon}{opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accent color */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1"><Palette size={10} /> Accent Color</span>
          </p>
          <div className="flex gap-2">
            {ACCENTS.map(c => (
              <button
                key={c}
                onClick={() => setAccentColor(c)}
                className="w-7 h-7 rounded-lg transition-all flex items-center justify-center"
                style={{ background: c, boxShadow: accentColor === c ? `0 0 0 2px var(--bg-surface), 0 0 0 4px ${c}` : 'none' }}
              >
                {accentColor === c && <Check size={11} className="text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Preferences</p>
          <SettingToggle label="Notifications" value={notifications} onChange={setNotifications} />
        </div>
      </div>

      <div className="px-4 pb-3">
        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl text-xs font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#4f8ef7,#7c5cfc)' }}
        >
          Done
        </button>
      </div>
    </Dropdown>
  )
}

function SettingToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium" style={{ color: '#475569' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="w-9 h-5 rounded-full transition-all relative"
        style={{ background: value ? '#4f8ef7' : '#e2e8f0' }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: value ? '18px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
        />
      </button>
    </div>
  )
}

// ── User profile panel ───────────────────────────────────────────────────────
function UserPanel({ onClose }: { onClose: () => void }) {
  const { currentUser, logout } = useStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    onClose()
    navigate('/login')
  }

  const initial = (currentUser?.name ?? 'U').charAt(0).toUpperCase()

  return (
    <Dropdown style={{ width: '260px' }}>
      {/* Profile header */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg,#4f8ef7,#7c5cfc)' }}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {currentUser?.name ?? 'User'}
            </p>
            <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
              {currentUser?.email ?? ''}
            </p>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-lg shrink-0 transition-colors" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="p-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <LogOut size={13} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: '#ef4444' }}>Sign out</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Log out of your account</p>
          </div>
        </button>
      </div>
    </Dropdown>
  )
}

// ── Search bar with live results ─────────────────────────────────────────────
const PAGES = [
  { label: 'Dashboard',        to: '/dashboard', icon: <LayoutDashboard size={13} /> },
  { label: 'Data Source',      to: '/',          icon: <FileText size={13} /> },
  { label: 'Report Builder',   to: '/builder',   icon: <LayoutDashboard size={13} /> },
  { label: 'Templates',        to: '/templates', icon: <LayoutTemplate size={13} /> },
  { label: 'Archive',          to: '/archive',   icon: <FileText size={13} /> },
  { label: 'AI Insights',      to: '/ai-insights', icon: <FileText size={13} /> },
  { label: 'Analytics',        to: '/analytics', icon: <FileText size={13} /> },
]

function SearchBar() {
  const navigate = useNavigate()
  const { uploads, archivedReports } = useStore()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const q = query.toLowerCase().trim()

  const matchedPages = q
    ? PAGES.filter(p => p.label.toLowerCase().includes(q))
    : []

  const matchedTemplates = q
    ? TEMPLATES.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      ).slice(0, 5)
    : []

  const matchedFiles = q
    ? uploads.filter(u => u.name.toLowerCase().includes(q)).slice(0, 4)
    : []

  const matchedArchive = q
    ? archivedReports.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.tags.some(tag => tag.toLowerCase().includes(q)) ||
        r.department.toLowerCase().includes(q)
      ).slice(0, 4)
    : []

  const hasResults = matchedPages.length + matchedTemplates.length + matchedFiles.length + matchedArchive.length > 0

  function go(to: string) {
    navigate(to)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative hidden md:flex items-center">
      <Search size={13} className="absolute left-3 pointer-events-none" style={{ color: '#94a3b8' }} />
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={e => { setOpen(true); e.currentTarget.style.borderColor = '#7eb3f7'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,142,247,0.1)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(196,210,235,0.8)'; e.currentTarget.style.boxShadow = 'none' }}
        onKeyDown={e => {
          if (e.key === 'Escape') { setQuery(''); setOpen(false) }
        }}
        placeholder="Search reports, templates…"
        className="pl-8 pr-10 py-1.5 text-xs rounded-lg border outline-none transition-all"
        style={{ width: '220px', background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(196,210,235,0.8)', color: '#334155' }}
      />
      {query && (
        <button
          onClick={() => { setQuery(''); setOpen(false) }}
          className="absolute right-3"
          style={{ color: '#94a3b8' }}
        >
          <X size={11} />
        </button>
      )}
      {!query && (
        <span className="absolute right-3 text-[10px] font-medium px-1 py-0.5 rounded pointer-events-none"
          style={{ background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
          ⌘K
        </span>
      )}

      {open && query && (
        <div
          className="absolute top-full left-0 mt-2 z-50 rounded-2xl overflow-hidden"
          style={{
            width: '320px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}
        >
          {!hasResults ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>No results for "{query}"</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {matchedPages.length > 0 && (
                <ResultGroup label="Pages">
                  {matchedPages.map(p => (
                    <ResultRow key={p.to} icon={p.icon} title={p.label} sub="Navigate to page" onClick={() => go(p.to)} />
                  ))}
                </ResultGroup>
              )}
              {matchedTemplates.length > 0 && (
                <ResultGroup label="Templates">
                  {matchedTemplates.map(t => (
                    <ResultRow
                      key={t.id}
                      icon={<LayoutTemplate size={13} />}
                      title={t.name}
                      sub={t.category}
                      onClick={() => go('/templates')}
                    />
                  ))}
                </ResultGroup>
              )}
              {matchedFiles.length > 0 && (
                <ResultGroup label="Uploaded Files">
                  {matchedFiles.map(u => (
                    <ResultRow
                      key={u.id}
                      icon={<FileText size={13} />}
                      title={u.name}
                      sub={`${u.rows.length} rows · ${u.status}`}
                      onClick={() => go('/')}
                    />
                  ))}
                </ResultGroup>
              )}
              {matchedArchive.length > 0 && (
                <ResultGroup label="Archived Reports">
                  {matchedArchive.map(r => (
                    <ResultRow
                      key={r.id}
                      icon={<FileText size={13} />}
                      title={r.title}
                      sub={`${r.department} · ${r.tags.join(', ')}`}
                      onClick={() => go('/archive')}
                    />
                  ))}
                </ResultGroup>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function ResultRow({ icon, title, sub, onClick }: {
  icon: React.ReactNode; title: string; sub: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
      style={{ color: 'var(--text-primary)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,142,247,0.06)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'rgba(79,142,247,0.08)', color: '#4f8ef7' }}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{title}</p>
        <p className="text-[10px] truncate" style={{ color: '#94a3b8' }}>{sub}</p>
      </div>
    </button>
  )
}

// ── Main Header ──────────────────────────────────────────────────────────────
export default function Header() {
  const location = useLocation()
  const isBuilder = location.pathname.startsWith('/builder')
  const { showToast, reportTitle, currentUser } = useStore()
  const userInitial = (currentUser?.name ?? 'U').charAt(0).toUpperCase()

  const [openPanel, setOpenPanel] = useState<'notifications' | 'settings' | 'user' | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpenPanel(null)
      }
    }
    if (openPanel) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openPanel])

  const toggle = (panel: typeof openPanel) =>
    setOpenPanel(prev => prev === panel ? null : panel)

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(
      () => showToast(`Link copied: "${reportTitle}"`, 'success'),
      () => showToast('Could not copy — ' + url, 'info'),
    )
  }

  const unreadCount = NOTIFICATIONS.filter(n => !n.read).length

  return (
    <header
      className="h-14 flex items-center justify-between px-5 shrink-0 z-20"
      style={{
        background: 'var(--bg-header)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-header)',
        boxShadow: 'var(--shadow-header)',
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Search */}
      <SearchBar />

      {/* Right actions */}
      <div ref={panelRef} className="flex items-center gap-1.5 relative">
        {isBuilder && (
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-white text-xs font-semibold rounded-lg transition-all"
            style={{ background: 'linear-gradient(135deg,#4f8ef7,#7c5cfc)', boxShadow: '0 2px 10px rgba(79,142,247,0.3)' }}
          >
            <Link size={13} />
            Share
          </button>
        )}

        {/* Help */}
        <IconBtn
          active={false}
          onClick={() => showToast('Upload CSV/Excel/JSON → map columns → drag widgets to build reports.', 'info')}
          title="Help"
        >
          <HelpCircle size={15} />
        </IconBtn>

        {/* Bell */}
        <div className="relative">
          <IconBtn active={openPanel === 'notifications'} onClick={() => toggle('notifications')} title="Notifications">
            <Bell size={15} />
          </IconBtn>
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center pointer-events-none"
              style={{ background: '#ef4444', fontSize: '9px', fontWeight: 700 }}
            >
              {unreadCount}
            </span>
          )}
          {openPanel === 'notifications' && <NotificationsPanel onClose={() => setOpenPanel(null)} />}
        </div>

        {/* Settings */}
        <div className="relative">
          <IconBtn active={openPanel === 'settings'} onClick={() => toggle('settings')} title="Settings">
            <Settings size={15} />
          </IconBtn>
          {openPanel === 'settings' && <SettingsPanel onClose={() => setOpenPanel(null)} />}
        </div>

        {/* User avatar */}
        <div className="relative ml-1">
          <button
            onClick={() => toggle('user')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg,#4f8ef7,#7c5cfc)',
              boxShadow: openPanel === 'user' ? '0 0 0 2px white, 0 0 0 4px #4f8ef7' : '0 2px 8px rgba(79,142,247,0.3)',
            }}
            title="Profile"
          >
            {userInitial}
          </button>
          {openPanel === 'user' && <UserPanel onClose={() => setOpenPanel(null)} />}
        </div>
      </div>
    </header>
  )
}

function IconBtn({ onClick, title, children, active }: {
  onClick: () => void; title: string; children: React.ReactNode; active: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
      style={{ color: active ? '#4f8ef7' : '#94a3b8', background: active ? 'rgba(79,142,247,0.1)' : 'transparent' }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' } }}
    >
      {children}
    </button>
  )
}
