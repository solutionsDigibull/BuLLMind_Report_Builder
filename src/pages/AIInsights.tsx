import {
  BarChart2,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Terminal,
  User,
  WifiOff,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

// ─── Ollama client ────────────────────────────────────────────────────────────

const OLLAMA_BASE = 'http://localhost:11434'
const DEFAULT_MODEL = 'llama3.2'

async function checkOllama(): Promise<{ running: boolean; models: string[] }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3000)
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return { running: false, models: [] }
    const data = await res.json() as { models?: { name: string }[] }
    const models = (data.models ?? []).map((m) => m.name)
    return { running: true, models }
  } catch {
    clearTimeout(timer)
    return { running: false, models: [] }
  }
}

async function ollamaChatStream(
  model: string,
  userText: string,
  systemPrompt: string,
  onToken: (token: string) => void,
): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      stream: true,
    }),
  })
  if (!res.ok) throw new Error(`Ollama responded with status ${res.status}`)

  const reader = res.body?.getReader()
  const decoder = new TextDecoder()
  let full = ''

  if (!reader) throw new Error('No response body')

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
      if (!line.trim()) continue
      try {
        const json = JSON.parse(line) as { message?: { content?: string }; done?: boolean }
        const token = json.message?.content ?? ''
        full += token
        onToken(token)
      } catch { /* partial line, skip */ }
    }
  }

  return full
}

// ─── Chat types & helpers ────────────────────────────────────────────────────

interface GeneratedCard {
  title: string
  type: 'report' | 'dashboard'
  kpis: { label: string; value: string; trend: string; up: boolean; field?: string }[]
  chartField?: string
  chartGroupBy?: string
  insight: string
}

interface Message {
  id: string
  role: 'user' | 'ai'
  text: string
  card?: GeneratedCard
  loading?: boolean
}

let _id = 0
const uid = () => String(++_id)

const SYSTEM_PROMPT = `You are an AI assistant for BuLLMind, a manufacturing and BOM (Bill of Materials) reporting platform.
Help users generate reports and dashboards about purchasing, production, quality, logistics, inventory, and sales.

When the user asks for a report or dashboard, respond with:
1. A helpful analysis text (2–3 sentences, conversational tone).
2. Immediately after your text, a JSON block in this EXACT format:

\`\`\`json
{
  "title": "Report Title",
  "type": "report",
  "kpis": [
    { "label": "KPI Name", "value": "123", "trend": "+5%", "up": true, "field": "column_name" },
    { "label": "KPI Name", "value": "456", "trend": "-2%", "up": false, "field": "column_name" },
    { "label": "KPI Name", "value": "78%", "trend": "+1%", "up": true, "field": "column_name" },
    { "label": "KPI Name", "value": "12", "trend": "N/A", "up": true, "field": "column_name" }
  ],
  "chartField": "column_name",
  "chartGroupBy": "column_name",
  "insight": "One key actionable insight sentence."
}
\`\`\`

Rules:
- "type" must be "report" or "dashboard".
- "kpis" must have exactly 4 items.
- "value" is always a string (number, percentage, or currency).
- "trend" is a string like "+5%", "-2", "N/A".
- "up" is a boolean: true if the trend is positive/good, false if negative/bad.
- "field" is the data column name most relevant to that KPI (use from available columns if provided).
- "chartField" is the numeric column to plot on the chart.
- "chartGroupBy" is the categorical column to group the chart by.
- Make all values realistic for a manufacturing context.
- If the message is purely conversational (greetings, clarifications), reply with text only — no JSON block.`

function buildSystemPrompt(columns: string[]): string {
  if (columns.length === 0) return SYSTEM_PROMPT
  return SYSTEM_PROMPT +
    `\n\nThe user has uploaded data with these exact columns: ${columns.join(', ')}.\n` +
    `Use these column names for "field", "chartField", and "chartGroupBy" in your JSON. Only use column names from this list.`
}

const SEED_RESPONSES: { keywords: string[]; text: string; card: GeneratedCard }[] = [
  {
    keywords: ['purchas', 'spend', 'vendor', 'procure'],
    text: "I analyzed your purchasing data. Total spend is up 12% vs last quarter, driven mainly by raw material costs. I recommend renegotiating terms with your top 3 vendors.",
    card: {
      title: 'Purchasing Spend Analysis', type: 'report',
      kpis: [
        { label: 'Total Spend', value: '$2.4M', trend: '+12%', up: false },
        { label: 'Unique Vendors', value: '38', trend: '+3', up: true },
        { label: 'Avg Unit Cost', value: '$142', trend: '+8%', up: false },
        { label: 'POs Issued', value: '214', trend: '+5%', up: true },
      ],
      insight: 'Top vendor "Apex Materials" accounts for 31% of total spend. Consider dual-sourcing to reduce risk.',
    },
  },
  {
    keywords: ['production', 'efficiency', 'oee', 'throughput', 'downtime'],
    text: "Here's your Production Efficiency Dashboard. OEE sits at 78.4% — below the industry benchmark of 85%. Unplanned downtime is the primary drag.",
    card: {
      title: 'Production Efficiency Dashboard', type: 'dashboard',
      kpis: [
        { label: 'OEE Score', value: '78.4%', trend: '-2.1%', up: false },
        { label: 'Throughput', value: '4,820 units', trend: '+1.3%', up: true },
        { label: 'Defect Rate', value: '1.8%', trend: '-0.4%', up: true },
        { label: 'Downtime hrs', value: '34h', trend: '+6h', up: false },
      ],
      insight: 'Line 3 accounts for 62% of unplanned downtime. A targeted PM schedule could recover ~18 OEE points.',
    },
  },
  {
    keywords: ['quality', 'defect', 'inspection', 'pass', 'reject'],
    text: "I've generated a Quality Control summary. Pass rate is strong at 96.2%, but defects in the Surface Finish category have spiked.",
    card: {
      title: 'Quality Control Summary', type: 'report',
      kpis: [
        { label: 'Pass Rate', value: '96.2%', trend: '-0.8%', up: false },
        { label: 'Defects Found', value: '183', trend: '+22', up: false },
        { label: 'Inspections', value: '4,780', trend: '+310', up: true },
        { label: 'CAPA Open', value: '7', trend: '-2', up: true },
      ],
      insight: '"Surface Finish" defects up 34% WoW. Coating batch #C-2041 flagged for re-inspection.',
    },
  },
  {
    keywords: ['logistic', 'shipment', 'delivery', 'warehouse', 'inventory', 'stock'],
    text: "Here's your Logistics & Inventory overview. On-time delivery is at 91% — 3 lanes show consistent delays.",
    card: {
      title: 'Logistics Overview', type: 'dashboard',
      kpis: [
        { label: 'Active Shipments', value: '127', trend: '+14', up: true },
        { label: 'On-Time Delivery', value: '91%', trend: '-2%', up: false },
        { label: 'Delayed', value: '11', trend: '+3', up: false },
        { label: 'Warehouse Util.', value: '84%', trend: '+5%', up: false },
      ],
      insight: 'Routes SH-04, SH-11, SH-19 show >3 day average delay. Carrier substitution recommended.',
    },
  },
  {
    keywords: ['sales', 'revenue', 'customer', 'order', 'forecast'],
    text: "Sales performance looks healthy. Revenue is up 9% QoQ, with the top 5 customers driving 48% of total orders.",
    card: {
      title: 'Sales Performance Report', type: 'report',
      kpis: [
        { label: 'Total Revenue', value: '$3.1M', trend: '+9%', up: true },
        { label: 'Orders', value: '1,042', trend: '+7%', up: true },
        { label: 'Avg Order Value', value: '$2,975', trend: '+2%', up: true },
        { label: 'Forecast Acc.', value: '87%', trend: '+3%', up: true },
      ],
      insight: 'Customer "NovaTech Inc." placed 3× usual order volume. Proactive upsell opportunity identified.',
    },
  },
]

const FALLBACK_SEED = {
  text: "I've created a general summary based on your request. Upload your own data for deeper, file-specific insights.",
  card: {
    title: 'General Summary Report', type: 'report' as const,
    kpis: [
      { label: 'Data Points', value: '12,400', trend: 'N/A', up: true },
      { label: 'Anomalies', value: '6', trend: 'N/A', up: false },
      { label: 'Completeness', value: '98.2%', trend: '+0.4%', up: true },
      { label: 'Confidence', value: 'High', trend: 'N/A', up: true },
    ],
    insight: 'No major data quality issues detected. Proceed to builder to customise your report layout.',
  },
}

function seedFallback(input: string) {
  const lower = input.toLowerCase()
  return SEED_RESPONSES.find((r) => r.keywords.some((k) => lower.includes(k))) ?? FALLBACK_SEED
}

function parseAIResponse(raw: string): { text: string; card?: GeneratedCard } {
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/)
  if (!jsonMatch) return { text: raw.trim() }
  const textPart = raw.slice(0, jsonMatch.index).trim()
  try {
    const card = JSON.parse(jsonMatch[1]) as GeneratedCard
    if (!card.title || !Array.isArray(card.kpis)) return { text: raw.trim() }
    return { text: textPart, card }
  } catch {
    return { text: raw.trim() }
  }
}

// ─── Ollama setup panel ───────────────────────────────────────────────────────

function OllamaSetupPanel({ onRetry, checking }: { onRetry: () => void; checking: boolean }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="mx-6 mt-4 mb-0 border border-amber-200 rounded-xl bg-amber-50 overflow-hidden shrink-0">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-amber-100 transition-colors text-left"
      >
        <WifiOff size={14} className="text-amber-600 shrink-0" />
        <span className="text-sm font-semibold text-amber-800">Ollama not detected</span>
        <span className="text-xs text-amber-600 ml-1">— AI chat requires a local Ollama instance</span>
        <span className="ml-auto text-amber-500">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-amber-200">
          <p className="text-xs text-amber-700 pt-3">
            BuLLMind uses <strong>Ollama</strong> — a free, local LLM engine. All AI processing happens on your machine. No data is sent externally.
          </p>

          {/* Steps */}
          <div className="space-y-2">
            {[
              {
                step: '1',
                title: 'Install Ollama',
                desc: 'Download and install from ollama.com (Windows / macOS / Linux)',
                cmd: null,
                link: 'https://ollama.com/download',
              },
              {
                step: '2',
                title: 'Pull a model',
                desc: 'Open a terminal and run:',
                cmd: 'ollama pull llama3.2',
                link: null,
              },
              {
                step: '3',
                title: 'Start Ollama',
                desc: 'Ollama usually starts automatically. If not, run:',
                cmd: 'ollama serve',
                link: null,
              },
            ].map(({ step, title, desc, cmd, link }) => (
              <div key={step} className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-900">{title}</p>
                  <p className="text-[11px] text-amber-700">{desc}</p>
                  {cmd && (
                    <div className="mt-1 flex items-center gap-1.5 bg-gray-900 text-green-400 font-mono text-[11px] px-3 py-1.5 rounded-lg w-fit">
                      <Terminal size={10} />
                      {cmd}
                    </div>
                  )}
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 mt-1 text-[11px] text-blue-600 hover:underline"
                    >
                      {link} <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onRetry}
              disabled={checking}
              className="flex items-center gap-1.5 text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 disabled:opacity-60 transition-colors"
            >
              {checking
                ? <><Loader2 size={12} className="animate-spin" /> Checking…</>
                : <><RefreshCw size={12} /> Check connection</>}
            </button>
            <span className="text-[11px] text-amber-600">After setup, click to connect</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiChip({ label, value, trend, up }: { label: string; value: string; trend: string; up: boolean }) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-3 flex flex-col gap-1">
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      {trend !== 'N/A' && (
        <p className={`text-[10px] font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>{trend}</p>
      )}
    </div>
  )
}

function GeneratedCardView({ card }: { card: GeneratedCard }) {
  const navigate = useNavigate()
  const { loadTemplate, showToast } = useStore()

  function openInBuilder() {
    const widgets = [
      ...card.kpis.map((k, i) => ({
        id: `ai-kpi-${i}`, type: 'kpi' as const, title: k.label,
        dataField: k.field ?? 'quantity', order: i, span: 1 as const, color: '#2563eb',
      })),
      {
        id: 'ai-chart', type: 'bar-chart' as const, title: `${card.title} — Trend`,
        dataField: card.chartField ?? 'quantity',
        groupBy: card.chartGroupBy ?? 'category',
        order: card.kpis.length, span: 2 as const, color: '#2563eb',
      },
      {
        id: 'ai-table', type: 'table' as const, title: card.title,
        order: card.kpis.length + 1, span: 3 as const, color: '#2563eb',
      },
    ]
    loadTemplate(widgets, card.title)
    showToast(`"${card.title}" loaded in builder!`, 'success')
    navigate('/builder')
  }

  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {card.type === 'dashboard'
            ? <LayoutDashboard size={14} className="text-blue-600" />
            : <BarChart2 size={14} className="text-blue-600" />}
          <span className="text-sm font-semibold text-gray-800">{card.title}</span>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{card.type}</span>
        </div>
        <button
          onClick={openInBuilder}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-lg px-3 py-1 transition-colors"
        >
          Open in Builder →
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {card.kpis.map((k) => <KpiChip key={k.label} {...k} />)}
      </div>
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
        <Sparkles size={12} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">{card.insight}</p>
      </div>
    </div>
  )
}

// ─── Data context banner ──────────────────────────────────────────────────────

function DataContextBanner({ fileName, columns }: { fileName: string; columns: string[] }) {
  return (
    <div className="mx-6 mt-3 flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-100 rounded-xl shrink-0">
      <Database size={13} className="text-blue-500 shrink-0" />
      <span className="text-[11px] text-blue-700 font-semibold truncate max-w-[120px]" title={fileName}>{fileName}</span>
      <span className="text-[11px] text-blue-300">·</span>
      <div className="flex flex-wrap gap-1 flex-1 min-w-0">
        {columns.slice(0, 7).map(c => (
          <span key={c} className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-mono shrink-0">{c}</span>
        ))}
        {columns.length > 7 && (
          <span className="text-[10px] text-blue-400 shrink-0">+{columns.length - 7} more</span>
        )}
      </div>
      <span className="text-[10px] text-blue-400 shrink-0">AI knows your data</span>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Show me purchasing spend analysis by vendor',
  'Generate a production efficiency dashboard',
  'What are the top quality issues this month?',
  'Give me a logistics overview report',
  'Summarise sales performance this quarter',
]

type OllamaStatus = 'checking' | 'connected' | 'disconnected'

export default function AIInsights() {
  const { uploads, activeFileId } = useStore()

  const activeFile = activeFileId
    ? uploads.find(u => u.id === activeFileId)
    : uploads.find(u => u.standardizedRows.length > 0)
  const dataRows = activeFile?.standardizedRows ?? []
  const dataColumns = dataRows.length > 0 ? Object.keys(dataRows[0]) : []

  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>('checking')
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)

  const [messages, setMessages] = useState<Message[]>([{
    id: uid(),
    role: 'ai',
    text: "Hi! I'm your AI Insights assistant. Ask me to generate a report or dashboard — or use the suggestions below.",
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function detectOllama() {
    setOllamaStatus('checking')
    const { running, models } = await checkOllama()
    if (running) {
      setAvailableModels(models)
      // Pick best available model: prefer llama3.2, then first available
      const preferred = ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'phi3', 'gemma2']
      const best = preferred.find(m => models.some(am => am.startsWith(m))) ?? models[0]
      if (best) setSelectedModel(models.find(m => m.startsWith(best)) ?? models[0])
      setOllamaStatus('connected')
    } else {
      setOllamaStatus('disconnected')
    }
  }

  useEffect(() => { detectOllama() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: Message = { id: uid(), role: 'user', text: text.trim() }
    const placeholderId = uid()
    setMessages((m) => [...m, userMsg, { id: placeholderId, role: 'ai', text: '', loading: true }])
    setInput('')
    setLoading(true)

    try {
      if (ollamaStatus === 'connected') {
        // Remove loading spinner — start showing streamed tokens immediately
        setMessages((m) =>
          m.map((msg) => msg.id === placeholderId ? { id: placeholderId, role: 'ai', text: '', loading: false } : msg)
        )
        const raw = await ollamaChatStream(selectedModel, text.trim(), buildSystemPrompt(dataColumns), (token) => {
          setMessages((m) =>
            m.map((msg) => msg.id === placeholderId
              ? { ...msg, text: msg.text + token, loading: false }
              : msg)
          )
        })
        // Once streaming is done, parse for JSON card
        const { text: aiText, card } = parseAIResponse(raw)
        setMessages((m) =>
          m.map((msg) => msg.id === placeholderId ? { id: placeholderId, role: 'ai', text: aiText, card } : msg)
        )
      } else {
        // Seed fallback when Ollama isn't connected
        await new Promise((r) => setTimeout(r, 1000))
        const match = seedFallback(text)
        setMessages((m) =>
          m.map((msg) => msg.id === placeholderId
            ? { id: placeholderId, role: 'ai', text: match.text, card: match.card }
            : msg)
        )
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setMessages((m) =>
        m.map((msg) => msg.id === placeholderId
          ? { id: placeholderId, role: 'ai', text: `Error: ${errMsg}` }
          : msg)
      )
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Sparkles size={15} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">AI Insights</h1>
          <p className="text-xs text-gray-400">Local AI · Powered by Ollama · Generate reports & dashboards</p>
        </div>

        {/* Connection status */}
        <div className="ml-auto flex items-center gap-2">
          {ollamaStatus === 'checking' && (
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              <Loader2 size={11} className="animate-spin" /> Connecting…
            </span>
          )}
          {ollamaStatus === 'connected' && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11px] text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={11} className="text-green-500" /> Ollama connected
              </span>
              {availableModels.length > 0 && (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}
            </div>
          )}
          {ollamaStatus === 'disconnected' && (
            <span className="flex items-center gap-1.5 text-[11px] text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
              <WifiOff size={11} /> Not connected
            </span>
          )}
        </div>
      </div>

      {/* Ollama setup guide (shown only when disconnected) */}
      {ollamaStatus === 'disconnected' && (
        <OllamaSetupPanel onRetry={detectOllama} checking={false} />
      )}

      {/* Data context banner — shown when file is loaded */}
      {dataColumns.length > 0 && activeFile && (
        <DataContextBanner fileName={activeFile.name} columns={dataColumns} />
      )}

      {/* Chat area */}
      {messages.length <= 1 ? (
        /* Empty state — centered suggestions */
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
          <div className="text-center">
            <Sparkles size={30} className="text-blue-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">What would you like to analyse?</p>
            <p className="text-xs text-gray-400 mt-1">
              {dataColumns.length > 0
                ? `AI knows your data — ask about ${dataColumns.slice(0, 3).join(', ')} and more`
                : 'Ask AI to generate a report or choose a suggestion below'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-3.5 py-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Chat messages */
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollbar-thin">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                msg.role === 'ai' ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                {msg.role === 'ai'
                  ? <Bot size={13} className="text-white" />
                  : <User size={13} className="text-gray-600" />}
              </div>
              <div className={`max-w-2xl flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.loading ? (
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 size={13} className="text-blue-500 animate-spin" />
                    <span className="text-sm text-gray-400">
                      {ollamaStatus === 'connected' ? `Asking ${selectedModel}…` : 'Generating insights…'}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                    {msg.card && <GeneratedCardView card={msg.card} />}
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Chat input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
          className="flex items-center gap-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              ollamaStatus === 'connected'
                ? `Ask ${selectedModel} to generate a report or dashboard…`
                : 'Ask AI to generate a report or dashboard…'
            }
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0"
          >
            <Send size={15} />
          </button>
        </form>
        {ollamaStatus === 'disconnected' && (
          <p className="text-[10px] text-amber-600 mt-1.5 text-center">
            Ollama not connected — responses will use sample data. Set up Ollama above for real AI.
          </p>
        )}
      </div>
    </div>
  )
}
