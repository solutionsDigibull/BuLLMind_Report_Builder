// ─── OpenWork AI client helper ────────────────────────────────────────────────
// Talks to the local Express proxy (server.js) which forwards to OpenCode.
// Set VITE_OPENWORK_BASE in .env to override.

const OPENWORK_BASE =
  (import.meta as unknown as { env: Record<string, string> }).env?.VITE_OPENWORK_BASE ??
  'http://localhost:3001/api/openwork'

export async function checkOpenWorkAI(): Promise<{ running: boolean; models: string[]; via: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`${OPENWORK_BASE}/health`, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return { running: false, models: [], via: '' }
    const health = await res.json()
    const via: string = health?.via ?? 'openwork'

    const provRes = await fetch(`${OPENWORK_BASE}/providers`)
    if (!provRes.ok) return { running: true, models: [], via }
    const provData = await provRes.json()
    const provList: { id: string; models?: unknown }[] =
      Array.isArray(provData) ? provData : (provData?.providers ?? provData?.all ?? [])
    const models = provList.flatMap((p) => {
      const m = p.models ?? {}
      const ids = Array.isArray(m) ? m.map((x: { id: string }) => x.id) : Object.keys(m)
      return ids.map((id) => `${p.id}/${id}`)
    })
    return { running: true, models, via }
  } catch {
    clearTimeout(timer)
    return { running: false, models: [], via: '' }
  }
}

// ── Fetch available tools for a given model via SDK v2 ───────────────────────
export async function fetchAvailableTools(
  providerID: string,
  modelID: string,
): Promise<{ name: string; description: string }[]> {
  try {
    const res = await fetch(
      `${OPENWORK_BASE}/tools?provider=${encodeURIComponent(providerID)}&model=${encodeURIComponent(modelID)}`,
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

// ── Stream a chat message, optionally with enabled tools ─────────────────────
export async function openWorkChatStream(
  modelStr: string,
  userText: string,
  systemPrompt: string,
  onToken: (token: string) => void,
  enabledTools?: string[],
): Promise<string> {
  const [providerID, ...rest] = modelStr.split('/')
  const modelID = rest.join('/')

  const res = await fetch(`${OPENWORK_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerID,
      modelID,
      systemPrompt,
      userText,
      enabledTools: enabledTools ?? [],
    }),
  })
  if (!res.ok) throw new Error(`OpenWork chat error ${res.status}`)

  const reader = res.body?.getReader()
  const decoder = new TextDecoder()
  let full = ''
  if (!reader) throw new Error('No response body')

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    for (const line of decoder.decode(value, { stream: true }).split('\n')) {
      if (!line.trim()) continue
      try {
        const json = JSON.parse(line) as { token?: string }
        if (json.token) { full += json.token; onToken(json.token) }
      } catch { /* partial line */ }
    }
  }
  return full
}
