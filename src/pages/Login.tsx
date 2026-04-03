import { BarChart2, Eye, EyeOff, Lock, Mail, Shield, Zap } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store/useStore'

const FEATURES = [
  { icon: <BarChart2 size={15} />, text: 'Drag & drop report builder' },
  { icon: <Zap size={15} />,       text: 'AI-powered insights' },
  { icon: <Shield size={15} />,    text: '30+ industry templates' },
]

export default function Login() {
  const { login, showToast } = useStore()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800))
    const ok = login(email.trim(), password)
    if (!ok) {
      setError('Invalid credentials. Please try again.')
    } else {
      showToast('Welcome back!', 'success')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#eef2f9' }}>
      {/* Left — brand panel */}
      <div
        className="hidden lg:flex w-[420px] shrink-0 flex-col justify-between p-10"
        style={{ background: 'linear-gradient(160deg, #1e2a4a 0%, #0f172a 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4f8ef7 0%, #7c5cfc 100%)', boxShadow: '0 4px 16px rgba(79,142,247,0.4)' }}
          >
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">BuLLMind</span>
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-3xl font-bold leading-snug" style={{ color: '#f1f5f9' }}>
            Turn your data into<br />
            <span style={{
              background: 'linear-gradient(135deg, #4f8ef7 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              powerful reports.
            </span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: '#7b91b0' }}>
            The all-in-one report builder for manufacturing, procurement, and operations teams.
          </p>

          <div className="mt-8 space-y-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(79,142,247,0.15)', color: '#60a5fa' }}
                >
                  {f.icon}
                </div>
                <span className="text-sm font-medium" style={{ color: '#94afc8' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px]" style={{ color: '#3d5068' }}>
          © 2026 BuLLMind · v2.4.0
        </p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          className="w-full max-w-sm"
          style={{
            background: 'white',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: '0 8px 40px rgba(30,60,120,0.1), 0 2px 8px rgba(30,60,120,0.06)',
            border: '1px solid rgba(196,210,235,0.6)',
          }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4f8ef7,#7c5cfc)' }}>
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-800">BuLLMind</span>
          </div>

          <h2 className="text-xl font-bold mb-1" style={{ color: '#1e293b' }}>Sign in</h2>
          <p className="text-xs mb-7" style={{ color: '#94a3b8' }}>
            Enter any email &amp; password to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
                Email address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none transition-all"
                  style={{
                    border: error ? '1px solid #fca5a5' : '1px solid rgba(196,210,235,0.8)',
                    background: '#f8fafc',
                    color: '#1e293b',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#7eb3f7'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,142,247,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = error ? '#fca5a5' : 'rgba(196,210,235,0.8)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl outline-none transition-all"
                  style={{
                    border: error ? '1px solid #fca5a5' : '1px solid rgba(196,210,235,0.8)',
                    background: '#f8fafc',
                    color: '#1e293b',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#7eb3f7'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,142,247,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = error ? '#fca5a5' : 'rgba(196,210,235,0.8)'; e.currentTarget.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#94a3b8' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs font-medium px-3 py-2 rounded-lg" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                {error}
              </p>
            )}

            {/* Forgot */}
            <div className="flex justify-end">
              <button type="button" className="text-xs font-medium transition-colors" style={{ color: '#4f8ef7' }}
                onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
                onMouseLeave={e => e.currentTarget.style.color = '#4f8ef7'}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all mt-2"
              style={{
                background: loading ? '#93c5fd' : 'linear-gradient(135deg,#4f8ef7 0%,#7c5cfc 100%)',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(79,142,247,0.35)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[11px] mt-6" style={{ color: '#94a3b8' }}>
            Don't have an account?{' '}
            <button className="font-semibold transition-colors" style={{ color: '#4f8ef7' }}
              onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
              onMouseLeave={e => e.currentTarget.style.color = '#4f8ef7'}
            >
              Contact your admin
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
