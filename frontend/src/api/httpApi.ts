// HTTP client for the FastAPI backend. Endpoint paths are the proposed contract;
// keep them in sync with the backend routers (activity 3h).
import { ApiError, type Api, type AuditFilter, type DocumentFilter } from './types'
import type { Session } from '../types/api'

const TOKEN_KEY = 'ippl-chatbot:token'

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}
function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

function query(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '' && v !== 'all') q.set(k, String(v))
  const s = q.toString()
  return s ? `?${s}` : ''
}

export function createHttpApi(baseUrl: string): Api {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' }
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
    if (body !== undefined) headers['Content-Type'] = 'application/json'

    let res: Response
    try {
      res = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
    } catch {
      throw new ApiError(0, 'Tidak dapat terhubung ke server. Periksa koneksi Anda.')
    }
    if (res.status === 401) setToken(null)
    if (!res.ok) {
      let message = `Permintaan gagal (${res.status}).`
      try {
        const data = (await res.json()) as { detail?: unknown }
        if (typeof data.detail === 'string') message = data.detail
      } catch {
        /* non-JSON error body */
      }
      throw new ApiError(res.status, message)
    }
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  }

  return {
    async login(email, password) {
      const session = await request<Session>('POST', '/auth/login', { email, password })
      setToken(session.token)
      return session
    },
    async logout() {
      try {
        await request<void>('POST', '/auth/logout')
      } finally {
        setToken(null)
      }
    },
    async restoreSession() {
      if (!getToken()) return null
      try {
        return await request<Session>('GET', '/auth/me')
      } catch {
        return null
      }
    },

    listConversations: () => request('GET', '/conversations'),
    getConversation: (id) => request('GET', `/conversations/${encodeURIComponent(id)}`),
    deleteConversation: (id) => request('DELETE', `/conversations/${encodeURIComponent(id)}`),
    ask: (conversationId, question) => request('POST', '/chat/ask', { conversation_id: conversationId, question }),
    sendFeedback: (conversationId, messageId, value) =>
      request('PUT', `/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/feedback`, { value }),

    getDashboard: () => request('GET', '/admin/dashboard'),

    listDocuments: (f: DocumentFilter = {}) => request('GET', `/admin/documents${query({ q: f.q, classification: f.classification, status: f.status })}`),
    uploadDocument: (input) => request('POST', '/admin/documents', input),
    reclassifyDocument: (id, classification) => request('PATCH', `/admin/documents/${encodeURIComponent(id)}`, { classification }),
    deleteDocument: (id) => request('DELETE', `/admin/documents/${encodeURIComponent(id)}`),
    reindexAll: () => request('POST', '/admin/documents/reindex'),

    listRoles: () => request('GET', '/admin/roles'),
    updateRole: (role) => request('PUT', `/admin/roles/${encodeURIComponent(role.id)}`, role),
    listUsers: (q) => request('GET', `/admin/users${query({ q })}`),
    setUserRole: (userId, roleId) => request('PATCH', `/admin/users/${encodeURIComponent(userId)}`, { role_id: roleId }),
    setUserActive: (userId, active) => request('PATCH', `/admin/users/${encodeURIComponent(userId)}`, { active }),

    listAudit: (f: AuditFilter = {}) =>
      request('GET', `/audit${query({ q: f.q, role: f.role, action: f.action, result: f.result, page: f.page, page_size: f.pageSize })}`),
    verifyAuditChain: () => request('POST', '/audit/verify'),
  }
}
