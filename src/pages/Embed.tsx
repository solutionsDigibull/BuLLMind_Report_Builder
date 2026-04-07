/**
 * /embed — Minimal AI chat page for OpenWork iframe embedding.
 * No sidebar, no header. Clean full-height chat interface only.
 */
import { Bot, Loader2, Send, Sparkles, WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { checkOpenWorkAI, openWorkChatStream } from '../utils/openworkai'

const SYSTEM_PROMPT = `You are an AI assistant for BuLLMind, a manufacturing reporting platform.
Help users analyse data and generate reports. Be concise and practical.
When asked for a report, respond with a brief analysis followed by key insights.`

interface Message { id: string; role: 'user' | 'ai'; text: string; loading?: boolean }
let _n = 0
const uid = () => String(++_n)

export default function Embed() {
  const [status, setStatus]     = useState<'checking' | 'ready' | 'offline'>('checking')
  const [model, setModel]       = useState('')
  const [messages, setMessages] = useState<Message[]>([{
    id: uid(), role: 'ai',
    text: "Hi! I'm BuLLMind AI. Ask me to analyse data or generate a report.",
  }])
  const [input, setInput]   = useState('')
  const [busy, setBusy]     = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkOpenWorkAI().then(({ running, models }) => {
      if (running && models.length > 0) { setModel(models[0]); setStatus('ready') }
      else setStatus('offline')
    })
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    if (!input.trim() || busy) return
    const text = input.trim()
    const pid = uid()
    setMessages(m => [...m, { id: uid(), role: 'user', text }, { id: pid, role: 'ai', text: '', loading: true }])
    setInput('')
    setBusy(true)
    try {
      const raw = await openWorkChatStream(model, text, SYSTEM_PROMPT, token =>
        setMessages(m => m.map(msg => msg.id === pid ? { ...msg, text: msg.text + token, loading: false } : msg))
      )
      setMessages(m => m.map(msg => msg.id === pid ? { ...msg, text: raw, loading: false } : msg))
    } catch {
      setMessages(m => m.map(msg => msg.id === pid ? { ...msg, text: 'Error — please try again.', loading: false } : msg))
    } finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc', fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1e2a4a', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sparkles size={15} color="#60a5fa" />
        <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600 }}>BuLLMind AI</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: status === 'ready' ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
          {status === 'checking' && <><Loader2 size={10} className="animate-spin" /> Connecting…</>}
          {status === 'ready'    && '● Connected'}
          {status === 'offline'  && <><WifiOff size={10} /> Offline</>}
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'ai' && (
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 6, flexShrink: 0, marginTop: 2 }}>
                <Bot size={13} color="#2563eb" />
              </div>
            )}
            <div style={{
              maxWidth: '80%', padding: '8px 12px', borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.role === 'user' ? '#2563eb' : '#fff',
              color: msg.role === 'user' ? '#fff' : '#1e293b',
              fontSize: 13, lineHeight: 1.5,
              border: msg.role === 'ai' ? '1px solid #e2e8f0' : 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              {msg.loading ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : msg.text || <span style={{ opacity: 0.4 }}>…</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about your data…"
          disabled={busy || status !== 'ready'}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#f8fafc' }}
        />
        <button
          onClick={send}
          disabled={busy || !input.trim() || status !== 'ready'}
          style={{ width: 36, height: 36, borderRadius: 10, background: '#2563eb', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy || !input.trim() ? 0.5 : 1 }}
        >
          <Send size={14} color="#fff" />
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
