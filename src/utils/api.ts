// ─── Central API fetch wrapper ────────────────────────────────────────────────
// Uses HttpOnly cookies for auth — no token stored in JS.
// credentials: 'include' sends the cookie automatically on every request.

const BASE = 'http://localhost:3001'

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',           // send HttpOnly cookie automatically
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
}

export async function apiJson<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `API error ${res.status}`)
  }
  return res.json() as Promise<T>
}

// Multipart upload — omits Content-Type so the browser sets multipart/form-data with the correct boundary
export async function apiUpload<T = unknown>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `API error ${res.status}`)
  }
  return res.json() as Promise<T>
}
