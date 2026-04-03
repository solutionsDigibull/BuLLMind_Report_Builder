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

export default function App() {
  return (
    <BrowserRouter>
      <ThemeApplier />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DataIntegration />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/ai-insights" element={<AIInsights />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/:templateId" element={<TemplatePreviewPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/library" element={<Navigate to="/templates" replace />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
