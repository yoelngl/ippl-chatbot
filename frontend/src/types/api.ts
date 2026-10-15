// Data contract shared between the React frontend and the FastAPI backend.
// The backend should return JSON in exactly these shapes (snake_case is
// converted at the HTTP boundary if needed).

export type Classification = 'Public' | 'HR' | 'Finance' | 'Confidential'

export const CLASSIFICATIONS: Classification[] = ['Public', 'HR', 'Finance', 'Confidential']

export type RoleId = 'karyawan' | 'hr' | 'finance' | 'manajemen' | 'admin' | 'auditor'

export interface Role {
  id: RoleId
  name: string
  description: string
  /** Document classifications this role may retrieve in RAG queries. */
  classifications: Classification[]
  canManageDocuments: boolean
  canManageRoles: boolean
  canViewAuditLog: boolean
  userCount: number
}

export interface User {
  id: string
  name: string
  email: string
  roleId: RoleId
  title: string
  active: boolean
  lastLoginAt: string | null
}

export interface Session {
  token: string
  user: User
  role: Role
  expiresAt: string
}

export interface Citation {
  index: number
  documentId: string
  documentName: string
  location: string
  classification: Classification
  score: number
  snippet: string
}

export type AnswerStatus = 'answered' | 'denied' | 'blocked' | 'not_found'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  status?: AnswerStatus
  citations?: Citation[]
  /** Classification that caused a denial, when status === 'denied'. */
  deniedClassification?: Classification
  latencyMs?: number
  feedback?: 'up' | 'down' | null
}

export interface Conversation {
  id: string
  title: string
  updatedAt: string
  messages: ChatMessage[]
}

export type IndexStatus = 'indexed' | 'processing' | 'failed'

export interface DocumentItem {
  id: string
  name: string
  format: 'PDF' | 'DOCX'
  sizeMb: number
  classification: Classification
  status: IndexStatus
  progress?: number
  error?: string
  chunks: number | null
  uploadedBy: string
  updatedAt: string
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'QUERY'
  | 'QUERY_DENIED'
  | 'PROMPT_INJECTION'
  | 'FEEDBACK'
  | 'DOC_UPLOAD'
  | 'DOC_DELETE'
  | 'DOC_RECLASSIFY'
  | 'ROLE_UPDATE'

export type AuditResult = 'success' | 'denied' | 'blocked'

export interface AuditEntry {
  id: string
  timestamp: string
  actorName: string
  actorRole: RoleId | null
  action: AuditAction
  detail: string
  result: AuditResult
  /** SHA-256 of (previous hash + this entry); shortened for display. */
  hash: string
}

export type ServiceHealth = 'healthy' | 'busy' | 'down'

export interface ServiceStatus {
  id: string
  name: string
  detail: string
  health: ServiceHealth
}

export interface DashboardStats {
  queriesToday: number
  queriesDeltaPct: number
  p95LatencySec: number
  activeUsers: number
  capacityUsers: number
  positiveFeedbackPct: number
  feedbackCount: number
  feedbackPositive: number
  latencySeries: number[]
  documentsByClassification: Record<Classification, number>
  security: { promptInjections: number; rbacDenials: number; failedLogins: number }
  services: ServiceStatus[]
}

export interface AskResult {
  message: ChatMessage
  conversation: Conversation
}

export interface Page<T> {
  items: T[]
  total: number
}
