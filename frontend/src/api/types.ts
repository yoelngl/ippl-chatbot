import type {
  AskResult,
  AuditAction,
  AuditEntry,
  AuditResult,
  Classification,
  Conversation,
  DashboardStats,
  DocumentItem,
  IndexStatus,
  Page,
  Role,
  RoleId,
  Session,
  User,
} from '../types/api'

export interface DocumentFilter {
  q?: string
  classification?: Classification | 'all'
  status?: IndexStatus | 'all'
}

export interface AuditFilter {
  q?: string
  role?: RoleId | 'all'
  action?: AuditAction | 'all'
  result?: AuditResult | 'all'
  page?: number
  pageSize?: number
}

export interface UploadInput {
  name: string
  sizeMb: number
  classification: Classification
}

/** Everything the UI needs from the backend. Implemented by the mock and HTTP clients. */
export interface Api {
  login(email: string, password: string): Promise<Session>
  logout(): Promise<void>
  restoreSession(): Promise<Session | null>

  listConversations(): Promise<Conversation[]>
  getConversation(id: string): Promise<Conversation>
  deleteConversation(id: string): Promise<void>
  ask(conversationId: string | null, question: string): Promise<AskResult>
  sendFeedback(conversationId: string, messageId: string, value: 'up' | 'down' | null): Promise<void>

  getDashboard(): Promise<DashboardStats>

  listDocuments(filter?: DocumentFilter): Promise<DocumentItem[]>
  uploadDocument(input: UploadInput): Promise<DocumentItem>
  reclassifyDocument(id: string, classification: Classification): Promise<DocumentItem>
  deleteDocument(id: string): Promise<void>
  reindexAll(): Promise<void>

  listRoles(): Promise<Role[]>
  updateRole(role: Role): Promise<Role>
  listUsers(q?: string): Promise<User[]>
  setUserRole(userId: string, roleId: RoleId): Promise<User>
  setUserActive(userId: string, active: boolean): Promise<User>

  listAudit(filter?: AuditFilter): Promise<Page<AuditEntry>>
  verifyAuditChain(): Promise<{ ok: boolean; count: number; checkedAt: string }>
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
