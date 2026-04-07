import {
  Archive,
  BarChart2,
  BookOpen,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Database,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Plus,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import type { Department } from '../../types'

const DEPT_ITEMS: { label: Department; icon: React.ReactNode; color: string; bg: string }[] = [
  { label: 'Purchasing', icon: <ShoppingCart size={14} />, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  { label: 'Production', icon: <Wrench size={14} />,       color: '#60a5fa', bg: 'rgba(96,165,250,0.15)'  },
  { label: 'Quality',    icon: <Star size={14} />,         color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
  { label: 'Logistics',  icon: <Truck size={14} />,        color: '#34d399', bg: 'rgba(52,211,153,0.15)'  },
  { label: 'Sales',      icon: <TrendingUp size={14} />,   color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
]

const NAV_ITEMS = [
  { label: 'Dashboard',   to: '/dashboard',   icon: <LayoutDashboard size={14} /> },
  { label: 'Data Sources', to: '/',           icon: <Database size={14} /> },
  { label: 'AI Insights',  to: '/ai-insights', icon: <Sparkles size={14} /> },
  { label: 'Templates',    to: '/library',     icon: <BookOpen size={14} /> },
  { label: 'Analytics',    to: '/analytics',   icon: <LineChart size={14} /> },
  { label: 'Archive',      to: '/archive',     icon: <Archive size={14} /> },
]

export default function Sidebar() {
  const { activeDepartment, setActiveDepartment } = useStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [deptOpen, setDeptOpen] = useState(true)

  return (
    <>
      <aside
        className={`${collapsed ? 'w-14' : 'w-56'} flex flex-col shrink-0 h-full overflow-hidden transition-[width] duration-200 no-print`}
        style={{
          background: 'linear-gradient(180deg, #1e2a4a 0%, #162039 100%)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Brand */}
        <div
          className="px-3 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 flex items-center justify-center">
              <img src="/bull-icon.png" alt="BuLLMind" className="w-9 h-9 object-contain" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight" style={{ color: '#f1f5f9' }}>BuLLMind</p>
                <p className="text-[10px] font-medium" style={{ color: '#7b91b0' }}>Report Builder</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(v => !v)}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-colors"
            style={{ color: '#4a6080' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#94afc8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4a6080')}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight size={13} /> : <ChevronsLeft size={13} />}
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto scrollbar-thin ${collapsed ? 'px-2' : 'px-3'} py-4 space-y-5`}>
          {/* Departments */}
          <div>
            {!collapsed && (
              <button
                onClick={() => setDeptOpen(v => !v)}
                className="w-full flex items-center justify-between px-2 mb-1 group"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest transition-colors" style={{ color: '#4a6080' }}>
                  Departments
                </p>
                <ChevronDown
                  size={11}
                  style={{
                    color: '#4a6080',
                    transform: deptOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
            )}
            {(deptOpen || collapsed) && (
              <div className="space-y-1">
                {DEPT_ITEMS.map((item) => {
                  const isActive = activeDepartment === item.label
                  return (
                    <button
                      key={item.label}
                      onClick={() => { setActiveDepartment(item.label); navigate('/') }}
                      className={`w-full flex items-center ${collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2'} rounded-lg text-xs font-semibold transition-all`}
                      style={{
                        background: isActive ? item.bg : 'transparent',
                        color: isActive ? '#f1f5f9' : '#94afc8',
                      }}
                      title={collapsed ? item.label : undefined}
                    >
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all"
                        style={{
                          background: isActive ? item.bg : 'rgba(255,255,255,0.05)',
                          color: isActive ? item.color : '#5a7a99',
                        }}
                      >
                        {item.icon}
                      </span>
                      {!collapsed && item.label}
                      {!collapsed && isActive && (
                        <span
                          className="ml-auto w-1.5 h-1.5 rounded-full"
                          style={{ background: item.color }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Workspace */}
          <div>
            {!collapsed && (
              <p className="px-2 mb-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#4a6080' }}>
                Workspace
              </p>
            )}
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : undefined,
                    gap: collapsed ? undefined : '10px',
                    padding: collapsed ? '8px 0' : '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    transition: 'all 0.15s ease',
                    background: isActive ? 'rgba(79,142,247,0.15)' : 'transparent',
                    color: isActive ? '#f1f5f9' : '#94afc8',
                    textDecoration: 'none',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{
                          background: isActive ? 'rgba(79,142,247,0.2)' : 'rgba(255,255,255,0.05)',
                          color: isActive ? '#60a5fa' : '#5a7a99',
                        }}
                      >
                        {item.icon}
                      </span>
                      {!collapsed && item.label}
                      {!collapsed && isActive && (
                        <span
                          className="ml-auto w-1.5 h-1.5 rounded-full"
                          style={{ background: '#60a5fa' }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* New Analysis CTA */}
        <div className="px-3 pb-3">
          <button
            onClick={() => navigate('/')}
            className={`w-full flex items-center ${collapsed ? 'justify-center py-2.5' : 'justify-center gap-2 py-2.5'} rounded-xl text-xs font-bold text-white transition-all`}
            style={{
              background: 'linear-gradient(135deg, #4f8ef7 0%, #7c5cfc 100%)',
              boxShadow: '0 4px 16px rgba(79,142,247,0.35)',
            }}
            title={collapsed ? 'New Analysis' : undefined}
          >
            <Plus size={13} />
            {!collapsed && 'New Analysis'}
          </button>
        </div>

        {/* Footer */}
        <div className="px-3 pb-4 pt-2 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { label: 'Support',  icon: <HelpCircle size={13} />,    to: '/support' },
            { label: 'Feedback', icon: <MessageSquare size={13} />, to: '/feedback' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : undefined,
                gap: collapsed ? undefined : '10px',
                padding: collapsed ? '8px 0' : '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'all 0.15s ease',
                background: isActive ? 'rgba(79,142,247,0.1)' : 'transparent',
                color: isActive ? '#94afc8' : '#4a6080',
                textDecoration: 'none',
              })}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#94afc8'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4a6080'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {item.icon}
              {!collapsed && item.label}
            </NavLink>
          ))}
        </div>
      </aside>
    </>
  )
}
