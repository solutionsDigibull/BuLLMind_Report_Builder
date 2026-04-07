import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from './store/useStore'
import Layout from './components/layout/Layout'
import AIInsights from './pages/AIInsights'
import Analytics from './pages/Analytics'
import Archive from './pages/Archive'
import Builder from './pages/Builder'
import Dashboard from './pages/Dashboard'
import DataIntegration from './pages/DataIntegration'
import Templates from './pages/Templates'
import TemplatePreviewPage from './pages/TemplatePreviewPage'
import Support from './pages/Support'
import Feedback from './pages/Feedback'
import Login from './pages/Login'
import Embed from './pages/Embed'

function ThemeApplier() {
  const theme = useStore(s => s.theme)

  useEffect(() => {
    const root = document.documentElement

    const apply = (dark: boolean) => {
      root.setAttribute('data-theme', dark ? 'dark' : 'light')
    }

    if (theme === 'dark') {
      apply(true)
    } else if (theme === 'light') {
      apply(false)
    } else {
      // system — follow OS
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mq.matches)
      const handler = (e: MediaQueryListEvent) => apply(e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  return null
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useStore(s => s.isLoggedIn)
  const authReady  = useStore(s => s.authReady)

  if (!authReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f8ef7', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const initAuth = useStore(s => s.initAuth)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <BrowserRouter>
      <ThemeApplier />
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Public embed route — no auth needed, used by OpenWork iframe */}
        <Route path="/embed" element={<Embed />} />
        <Route element={<AuthGuard><Layout /></AuthGuard>}>
          <Route path="/" element={<DataIntegration />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/ai-insights" element={<AIInsights />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/:templateId" element={<TemplatePreviewPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/library" element={<Navigate to="/templates" replace />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/support" element={<Support />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
