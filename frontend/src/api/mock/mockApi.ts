// In-browser mock backend. Implements the same Api interface as the HTTP
// client and keeps its state in localStorage so a demo survives reloads.
import type {
  AuditEntry,
  Classification,
  ChatMessage,
  Conversation,
  DashboardStats,
  DocumentItem,
  Role,
  RoleId,
  Session,
  User,
} from '../../types/api'
import { ApiError, type Api, type AuditFilter, type DocumentFilter, type UploadInput } from '../types'
import {
  DEMO_ACCOUNTS,
  SEED_AUDIT,
  SEED_CONVERSATIONS,
  SEED_DOCUMENTS,
  SEED_ROLES,
  SEED_USERS,
  type MockDocument,
} from './data'
import { answerQuestion } from './rag'

const STATE_KEY = 'ippl-chatbot:mock-state:v1'
const SESSION_KEY = 'ippl-chatbot:session'

interface AuditRow extends AuditEntry {
  fullHash: string
}

interface State {
  roles: Role[]
  users: User[]
  documents: MockDocument[]
  conversations: Record<string, Conversation[]>
  audit: AuditRow[]
  seq: number
}

/* ---------------- helpers ---------------- */

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** FNV-1a based 64-bit hex digest. The real backend uses SHA-256; this only demonstrates the chain. */
export function chainHash(prev: string, payload: string): string {
  const s = prev + '|' + payload
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 ^ c, 0x5bd1e995) >>> 0
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

const shortHash = (h: string) => `${h.slice(0, 4)}…${h.slice(-3)}`
const auditPayload = (e: Omit<AuditEntry, 'hash'>) => [e.id, e.timestamp, e.actorName, e.actorRole, e.action, e.detail, e.result].join('|')

function seedState(): State {
  const state: State = {
    roles: clone(SEED_ROLES),
    users: clone(SEED_USERS),
    documents: clone(SEED_DOCUMENTS),
    conversations: clone(SEED_CONVERSATIONS),
    audit: [],
    seq: 1000,
  }
  for (const e of SEED_AUDIT) appendAudit(state, e)
  return state
}

function appendAudit(state: State, e: Omit<AuditEntry, 'id' | 'hash'>): AuditRow {
  const prev = state.audit.length ? state.audit[state.audit.length - 1].fullHash : 'genesis'
  const id = `a-${++state.seq}`
  const fullHash = chainHash(prev, auditPayload({ ...e, id }))
  const row: AuditRow = { ...e, id, fullHash, hash: shortHash(fullHash) }
  state.audit.push(row)
  return row
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* storage unavailable: keep state in memory only */
  }
}

/* ---------------- the mock ---------------- */

export interface MockOptions {
  /** Artificial latency in ms. Tests pass 0. */
  latency?: number
  persist?: boolean
}

export function createMockApi(options: MockOptions = {}): Api & { reset(): void } {
  const latency = options.latency ?? 250
  const persist = options.persist ?? true

  let state: State = (() => {
    const raw = persist ? readStorage(STATE_KEY) : null
    if (raw) {
      try {
        return JSON.parse(raw) as State
      } catch {
        /* fall through to seed */
      }
    }
    return seedState()
  })()
  let sessionUserId: string | null = persist ? readStorage(SESSION_KEY) : null

  const save = () => {
    if (persist) writeStorage(STATE_KEY, JSON.stringify(state))
  }
  const wait = (factor = 1) => (latency > 0 ? sleep(latency * factor) : Promise.resolve())

  const roleOf = (roleId: RoleId) => {
    const role = state.roles.find((r) => r.id === roleId)
    if (!role) throw new ApiError(500, `Peran ${roleId} tidak ditemukan`)
    return role
  }

  const currentUser = (): User => {
    const user = state.users.find((u) => u.id === sessionUserId)
    if (!user || !user.active) throw new ApiError(401, 'Sesi berakhir. Silakan masuk kembali.')
    return user
  }

  const requirePermission = (check: (r: Role) => boolean): User => {
    const user = currentUser()
    if (!check(roleOf(user.roleId))) throw new ApiError(403, 'Peran Anda tidak memiliki izin untuk aksi ini.')
    return user
  }

  const makeSession = (user: User): Session => ({
    token: `mock.${user.id}`,
    user: clone(user),
    role: clone(withCounts(roleOf(user.roleId))),
    expiresAt: new Date(Date.now() + 8 * 3600_000).toISOString(),
  })

  const withCounts = (role: Role): Role => ({ ...role, userCount: state.users.filter((u) => u.roleId === role.id).length })

  const audit = (user: User | null, action: AuditEntry['action'], detail: string, result: AuditEntry['result'] = 'success') =>
    appendAudit(state, { timestamp: new Date().toISOString(), actorName: user?.name ?? 'anonim', actorRole: user?.roleId ?? null, action, detail, result })

  /** Advance documents that are being processed, one step per listing. */
  const tickIngestion = () => {
    for (const d of state.documents) {
      if (d.status !== 'processing') continue
      d.progress = Math.min(100, (d.progress ?? 0) + 19)
      if (d.progress >= 100) {
        d.status = 'indexed'
        d.chunks = d.chunks ?? Math.max(8, Math.round(d.sizeMb * 60))
        delete d.progress
      }
    }
  }

  const publicDoc = (d: MockDocument): DocumentItem => {
    const { content: _content, ...rest } = d
    void _content
    return clone(rest)
  }

  const api: Api & { reset(): void } = {
    reset() {
      state = seedState()
      sessionUserId = null
      save()
      if (persist) writeStorage(SESSION_KEY, null)
    },

    async login(email, password) {
      await wait(2)
      const account = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
      const user = account && state.users.find((u) => u.id === account.userId)
      if (!account || !user || account.password !== password) {
        appendAudit(state, { timestamp: new Date().toISOString(), actorName: email || 'anonim', actorRole: null, action: 'LOGIN', detail: 'Email atau kata sandi salah', result: 'denied' })
        save()
        throw new ApiError(401, 'Email atau kata sandi salah.')
      }
      if (!user.active) {
        audit(user, 'LOGIN', 'Akun nonaktif mencoba masuk', 'denied')
        save()
        throw new ApiError(403, 'Akun Anda dinonaktifkan. Hubungi Admin.')
      }
      user.lastLoginAt = new Date().toISOString()
      sessionUserId = user.id
      if (persist) writeStorage(SESSION_KEY, user.id)
      audit(user, 'LOGIN', 'Login akun demo · ' + navigatorLabel())
      save()
      return makeSession(user)
    },

    async logout() {
      await wait()
      const user = state.users.find((u) => u.id === sessionUserId) ?? null
      if (user) {
        audit(user, 'LOGOUT', 'Sesi diakhiri oleh pengguna')
        save()
      }
      sessionUserId = null
      if (persist) writeStorage(SESSION_KEY, null)
    },

    async restoreSession() {
      const user = state.users.find((u) => u.id === sessionUserId)
      if (!user || !user.active) return null
      return makeSession(user)
    },

    /* ---------- chat ---------- */

    async listConversations() {
      await wait(0.5)
      const user = currentUser()
      return clone(state.conversations[user.id] ?? []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },

    async getConversation(id) {
      await wait(0.5)
      const user = currentUser()
      const conv = (state.conversations[user.id] ?? []).find((c) => c.id === id)
      if (!conv) throw new ApiError(404, 'Percakapan tidak ditemukan.')
      return clone(conv)
    },

    async deleteConversation(id) {
      await wait(0.5)
      const user = currentUser()
      state.conversations[user.id] = (state.conversations[user.id] ?? []).filter((c) => c.id !== id)
      save()
    },

    async ask(conversationId, question) {
      const user = currentUser()
      const role = roleOf(user.roleId)
      if (!role.classifications.length) throw new ApiError(403, 'Peran Anda tidak dapat menggunakan chat.')
      const text = question.trim()
      if (!text) throw new ApiError(422, 'Pertanyaan tidak boleh kosong.')
      if (text.length > 2000) throw new ApiError(422, 'Pertanyaan terlalu panjang (maks. 2.000 karakter).')

      const started = Date.now()
      await wait(4)

      const list = (state.conversations[user.id] ??= [])
      let conv = conversationId ? list.find((c) => c.id === conversationId) : undefined
      if (!conv) {
        conv = { id: `c-${++state.seq}`, title: text.length > 48 ? text.slice(0, 45) + '…' : text, updatedAt: '', messages: [] }
        list.push(conv)
      }
      const now = new Date().toISOString()
      conv.messages.push({ id: `m-${++state.seq}`, role: 'user', content: text, createdAt: now })

      const outcome = answerQuestion(text, state.documents, role.classifications)
      const reply: ChatMessage = { id: `m-${++state.seq}`, role: 'assistant', content: '', createdAt: new Date().toISOString(), feedback: null }
      const quoted = `"${text.length > 60 ? text.slice(0, 57) + '…' : text}"`

      switch (outcome.kind) {
        case 'answered':
          reply.status = 'answered'
          reply.content = outcome.content
          reply.citations = outcome.citations
          audit(user, 'QUERY', `${quoted} · ${outcome.citations.length} sumber dikutip`)
          break
        case 'denied':
          reply.status = 'denied'
          reply.deniedClassification = outcome.classification
          reply.content = `Tidak ada dokumen yang dapat diakses peran ${role.name} untuk pertanyaan ini. Dokumen terkait diklasifikasikan sebagai ${outcome.classification}. Hubungi Admin jika Anda memerlukan akses.`
          audit(user, 'QUERY_DENIED', `${quoted} · dokumen ${outcome.classification} tidak diizinkan`, 'denied')
          break
        case 'blocked':
          reply.status = 'blocked'
          reply.content = 'Pertanyaan ini diblokir karena terdeteksi sebagai upaya mengubah instruksi sistem (prompt injection). Silakan ajukan pertanyaan tentang isi dokumen.'
          audit(user, 'PROMPT_INJECTION', `Input diblokir: ${quoted}`, 'blocked')
          break
        case 'not_found':
          reply.status = 'not_found'
          reply.content = 'Maaf, saya tidak menemukan informasi tentang hal ini di dokumen yang tersedia. Coba gunakan kata kunci lain atau tanyakan langsung ke divisi terkait.'
          audit(user, 'QUERY', `${quoted} · 0 sumber ditemukan`)
          break
      }
      reply.latencyMs = Date.now() - started
      conv.messages.push(reply)
      conv.updatedAt = reply.createdAt
      save()
      return { message: clone(reply), conversation: clone(conv) }
    },

    async sendFeedback(conversationId, messageId, value) {
      await wait(0.5)
      const user = currentUser()
      const conv = (state.conversations[user.id] ?? []).find((c) => c.id === conversationId)
      const msg = conv?.messages.find((m) => m.id === messageId)
      if (!msg) throw new ApiError(404, 'Pesan tidak ditemukan.')
      msg.feedback = value
      if (value) audit(user, 'FEEDBACK', `Umpan balik ${value === 'up' ? 'positif' : 'negatif'} pada jawaban #${messageId.replace('m-', '')}`)
      save()
    },

    /* ---------- admin: dashboard ---------- */

    async getDashboard() {
      await wait()
      requirePermission((r) => r.canManageDocuments || r.canManageRoles)
      const todayStr = new Date().toDateString()
      const todays = state.audit.filter((a) => new Date(a.timestamp).toDateString() === todayStr)
      const count = (action: AuditEntry['action']) => todays.filter((a) => a.action === action).length
      const fb = state.audit.filter((a) => a.action === 'FEEDBACK')
      const fbUp = fb.filter((a) => a.detail.includes('positif')).length
      const byClass = { Public: 0, HR: 0, Finance: 0, Confidential: 0 } as Record<Classification, number>
      for (const d of state.documents) byClass[d.classification]++
      const processing = state.documents.filter((d) => d.status === 'processing').length
      const failed = state.documents.filter((d) => d.status === 'failed').length
      const vectors = state.documents.reduce((s, d) => s + (d.chunks ?? 0), 0)

      const stats: DashboardStats = {
        queriesToday: 1284 + count('QUERY') + count('QUERY_DENIED'),
        queriesDeltaPct: 12,
        p95LatencySec: 3.4,
        activeUsers: state.users.filter((u) => u.active).length + 300,
        capacityUsers: 500,
        positiveFeedbackPct: Math.round(((412 + fbUp) / (474 + fb.length)) * 100),
        feedbackCount: 474 + fb.length,
        feedbackPositive: 412 + fbUp,
        latencySeries: [2.1, 1.9, 1.8, 1.8, 1.9, 2.2, 2.6, 3.1, 3.6, 3.9, 4.2, 4.1, 3.8, 3.5, 3.7, 4.4, 4.0, 3.6, 3.2, 2.9, 2.7, 2.5, 2.4, 3.4],
        documentsByClassification: byClass,
        security: { promptInjections: count('PROMPT_INJECTION'), rbacDenials: count('QUERY_DENIED'), failedLogins: todays.filter((a) => a.action === 'LOGIN' && a.result === 'denied').length },
        services: [
          { id: 'api', name: 'FastAPI (backend)', detail: 'Mode demo · respons lokal', health: 'healthy' },
          { id: 'db', name: 'PostgreSQL + pgvector', detail: `${state.documents.length} dokumen · ${vectors.toLocaleString('id-ID')} vektor`, health: 'healthy' },
          { id: 'llm', name: 'Ollama · Llama 3 8B', detail: 'GPU 68% · 31 token/dtk', health: 'healthy' },
          { id: 'idp', name: 'Keycloak (IdP)', detail: 'JWT valid · akun demo', health: 'healthy' },
          { id: 'ingest', name: 'Worker ingestion', detail: processing ? `${processing} dokumen dalam antrean` : failed ? `${failed} dokumen gagal diproses` : 'Antrean kosong', health: processing ? 'busy' : failed ? 'down' : 'healthy' },
        ],
      }
      return stats
    },

    /* ---------- admin: documents ---------- */

    async listDocuments(filter: DocumentFilter = {}) {
      await wait()
      requirePermission((r) => r.canManageDocuments)
      tickIngestion()
      save()
      const q = filter.q?.trim().toLowerCase()
      return state.documents
        .filter((d) => !q || d.name.toLowerCase().includes(q))
        .filter((d) => !filter.classification || filter.classification === 'all' || d.classification === filter.classification)
        .filter((d) => !filter.status || filter.status === 'all' || d.status === filter.status)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(publicDoc)
    },

    async uploadDocument(input: UploadInput) {
      await wait(2)
      const user = requirePermission((r) => r.canManageDocuments)
      const lower = input.name.toLowerCase()
      if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) throw new ApiError(422, 'Hanya file PDF atau DOCX yang didukung.')
      if (input.sizeMb > 20) throw new ApiError(413, 'Ukuran file melebihi 20 MB.')
      if (state.documents.some((d) => d.name === input.name)) throw new ApiError(409, 'Dokumen dengan nama yang sama sudah ada.')
      const doc: MockDocument = {
        id: `doc-${++state.seq}`,
        name: input.name,
        format: lower.endsWith('.pdf') ? 'PDF' : 'DOCX',
        sizeMb: Math.round(input.sizeMb * 10) / 10,
        classification: input.classification,
        status: 'processing',
        progress: 5,
        chunks: null,
        uploadedBy: user.name,
        updatedAt: new Date().toISOString(),
        content: [],
      }
      state.documents.push(doc)
      audit(user, 'DOC_UPLOAD', `${doc.name} → klasifikasi ${doc.classification}`)
      save()
      return publicDoc(doc)
    },

    async reclassifyDocument(id, classification) {
      await wait()
      const user = requirePermission((r) => r.canManageDocuments)
      const doc = state.documents.find((d) => d.id === id)
      if (!doc) throw new ApiError(404, 'Dokumen tidak ditemukan.')
      const from = doc.classification
      doc.classification = classification
      doc.updatedAt = new Date().toISOString()
      audit(user, 'DOC_RECLASSIFY', `${doc.name}: ${from} → ${classification}`)
      save()
      return publicDoc(doc)
    },

    async deleteDocument(id) {
      await wait()
      const user = requirePermission((r) => r.canManageDocuments)
      const doc = state.documents.find((d) => d.id === id)
      if (!doc) throw new ApiError(404, 'Dokumen tidak ditemukan.')
      state.documents = state.documents.filter((d) => d.id !== id)
      audit(user, 'DOC_DELETE', `${doc.name} dihapus beserta ${doc.chunks ?? 0} chunk`)
      save()
    },

    async reindexAll() {
      await wait()
      const user = requirePermission((r) => r.canManageDocuments)
      for (const d of state.documents) {
        if (d.status === 'failed') {
          d.status = 'processing'
          d.progress = 10
          delete d.error
        }
      }
      audit(user, 'DOC_UPLOAD', 'Indeks ulang semua dokumen dimulai')
      save()
    },

    /* ---------- admin: roles & users ---------- */

    async listRoles() {
      await wait()
      requirePermission((r) => r.canManageRoles)
      return state.roles.map((r) => clone(withCounts(r)))
    },

    async updateRole(role) {
      await wait()
      const user = requirePermission((r) => r.canManageRoles)
      const idx = state.roles.findIndex((r) => r.id === role.id)
      if (idx < 0) throw new ApiError(404, 'Peran tidak ditemukan.')
      if (role.id === user.roleId && !role.canManageRoles) throw new ApiError(422, 'Anda tidak dapat mencabut izin kelola peran dari peran Anda sendiri.')
      const before = state.roles[idx]
      state.roles[idx] = { ...clone(role), userCount: 0 }
      const added = role.classifications.filter((c) => !before.classifications.includes(c))
      const removed = before.classifications.filter((c) => !role.classifications.includes(c))
      const parts = [
        added.length ? `diberi akses ${added.join(', ')}` : '',
        removed.length ? `dicabut akses ${removed.join(', ')}` : '',
        before.canManageDocuments !== role.canManageDocuments ? `kelola dokumen ${role.canManageDocuments ? 'aktif' : 'nonaktif'}` : '',
        before.canViewAuditLog !== role.canViewAuditLog ? `lihat log audit ${role.canViewAuditLog ? 'aktif' : 'nonaktif'}` : '',
      ].filter(Boolean)
      audit(user, 'ROLE_UPDATE', `Peran ${role.name} ${parts.join('; ') || 'diperbarui'}`)
      save()
      return clone(withCounts(state.roles[idx]))
    },

    async listUsers(q) {
      await wait()
      requirePermission((r) => r.canManageRoles)
      const s = q?.trim().toLowerCase()
      return clone(state.users.filter((u) => !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)))
    },

    async setUserRole(userId, roleId) {
      await wait()
      const admin = requirePermission((r) => r.canManageRoles)
      const target = state.users.find((u) => u.id === userId)
      if (!target) throw new ApiError(404, 'Pengguna tidak ditemukan.')
      if (target.id === admin.id) throw new ApiError(422, 'Anda tidak dapat mengubah peran akun Anda sendiri.')
      const from = target.roleId
      target.roleId = roleId
      audit(admin, 'ROLE_UPDATE', `${target.name}: peran ${roleOf(from).name} → ${roleOf(roleId).name}`)
      save()
      return clone(target)
    },

    async setUserActive(userId, active) {
      await wait()
      const admin = requirePermission((r) => r.canManageRoles)
      const target = state.users.find((u) => u.id === userId)
      if (!target) throw new ApiError(404, 'Pengguna tidak ditemukan.')
      if (target.id === admin.id) throw new ApiError(422, 'Anda tidak dapat menonaktifkan akun Anda sendiri.')
      target.active = active
      audit(admin, 'ROLE_UPDATE', `${target.name} ${active ? 'diaktifkan' : 'dinonaktifkan'}`)
      save()
      return clone(target)
    },

    /* ---------- auditor ---------- */

    async listAudit(filter: AuditFilter = {}) {
      await wait()
      requirePermission((r) => r.canViewAuditLog)
      const q = filter.q?.trim().toLowerCase()
      const rows = state.audit
        .filter((a) => !q || [a.actorName, a.action, a.detail].some((v) => v.toLowerCase().includes(q)))
        .filter((a) => !filter.role || filter.role === 'all' || a.actorRole === filter.role)
        .filter((a) => !filter.action || filter.action === 'all' || a.action === filter.action)
        .filter((a) => !filter.result || filter.result === 'all' || a.result === filter.result)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      const pageSize = filter.pageSize ?? 10
      const page = Math.max(1, filter.page ?? 1)
      const items = rows.slice((page - 1) * pageSize, page * pageSize).map(({ fullHash: _f, ...rest }) => {
        void _f
        return rest
      })
      return { items: clone(items), total: rows.length }
    },

    async verifyAuditChain() {
      await wait(2)
      requirePermission((r) => r.canViewAuditLog)
      let prev = 'genesis'
      let ok = true
      for (const row of state.audit) {
        const { fullHash, hash: _h, ...rest } = row
        void _h
        const expected = chainHash(prev, auditPayload(rest))
        if (expected !== fullHash) {
          ok = false
          break
        }
        prev = fullHash
      }
      return { ok, count: state.audit.length, checkedAt: new Date().toISOString() }
    },
  }

  return api
}

function navigatorLabel(): string {
  if (typeof navigator === 'undefined') return 'Browser'
  const ua = navigator.userAgent
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : ''
  return os ? `${browser} / ${os}` : browser
}
