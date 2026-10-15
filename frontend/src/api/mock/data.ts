// Seed data for the mock backend. Everything here is fictional sample data
// for demos and testing; replace it with the group's real sample data (task 1d).
import type {
  AuditEntry,
  Classification,
  Conversation,
  DocumentItem,
  Role,
  RoleId,
  User,
} from '../../types/api'

/* ------------------------------------------------------------------ */
/* Test accounts: one login per role. Shown on the login page.        */
/* ------------------------------------------------------------------ */

export interface DemoAccount {
  email: string
  password: string
  userId: string
  label: string
}

export const DEMO_PASSWORD = 'demo123'

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'karyawan@chatbot.test', password: DEMO_PASSWORD, userId: 'u-karyawan', label: 'Karyawan' },
  { email: 'hr@chatbot.test', password: DEMO_PASSWORD, userId: 'u-hr', label: 'HR' },
  { email: 'finance@chatbot.test', password: DEMO_PASSWORD, userId: 'u-finance', label: 'Finance' },
  { email: 'manajemen@chatbot.test', password: DEMO_PASSWORD, userId: 'u-manajemen', label: 'Manajemen' },
  { email: 'admin@chatbot.test', password: DEMO_PASSWORD, userId: 'u-admin', label: 'Admin' },
  { email: 'auditor@chatbot.test', password: DEMO_PASSWORD, userId: 'u-auditor', label: 'Auditor' },
  // Inactive account, for testing that disabled users cannot log in.
  { email: 'nonaktif@chatbot.test', password: DEMO_PASSWORD, userId: 'u-nonaktif', label: 'Nonaktif' },
]

/* ------------------------------------------------------------------ */
/* Roles and the RBAC matrix                                          */
/* ------------------------------------------------------------------ */

export const SEED_ROLES: Role[] = [
  { id: 'karyawan', name: 'Karyawan', description: 'Default untuk semua karyawan', classifications: ['Public'], canManageDocuments: false, canManageRoles: false, canViewAuditLog: false, userCount: 0 },
  { id: 'hr', name: 'HR', description: 'Divisi Human Resources', classifications: ['Public', 'HR'], canManageDocuments: false, canManageRoles: false, canViewAuditLog: false, userCount: 0 },
  { id: 'finance', name: 'Finance', description: 'Divisi Keuangan', classifications: ['Public', 'Finance'], canManageDocuments: false, canManageRoles: false, canViewAuditLog: false, userCount: 0 },
  { id: 'manajemen', name: 'Manajemen', description: 'Direksi & kepala divisi', classifications: ['Public', 'HR', 'Finance', 'Confidential'], canManageDocuments: false, canManageRoles: false, canViewAuditLog: false, userCount: 0 },
  { id: 'admin', name: 'Admin', description: 'Pengelola sistem', classifications: ['Public'], canManageDocuments: true, canManageRoles: true, canViewAuditLog: false, userCount: 0 },
  { id: 'auditor', name: 'Auditor', description: 'Peninjau kepatuhan · hanya baca', classifications: [], canManageDocuments: false, canManageRoles: false, canViewAuditLog: true, userCount: 0 },
]

/* ------------------------------------------------------------------ */
/* Users: the login accounts above plus dummy users for the admin list */
/* ------------------------------------------------------------------ */

const today = (h: number, m: number) => {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
const daysAgo = (n: number, h = 9, m = 0) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export const SEED_USERS: User[] = [
  // Login accounts
  { id: 'u-karyawan', name: 'Andi Nugroho', email: 'karyawan@chatbot.test', roleId: 'karyawan', title: 'Staf Operasional', active: true, lastLoginAt: daysAgo(3) },
  { id: 'u-hr', name: 'Rina Pratama', email: 'hr@chatbot.test', roleId: 'hr', title: 'Staf HR', active: true, lastLoginAt: today(9, 1) },
  { id: 'u-finance', name: 'Dimas Fajar', email: 'finance@chatbot.test', roleId: 'finance', title: 'Analis Keuangan', active: true, lastLoginAt: today(13, 55) },
  { id: 'u-manajemen', name: 'Sari Wulandari', email: 'manajemen@chatbot.test', roleId: 'manajemen', title: 'Kepala Divisi', active: true, lastLoginAt: daysAgo(1, 17, 22) },
  { id: 'u-admin', name: 'Admin Sistem', email: 'admin@chatbot.test', roleId: 'admin', title: 'Administrator', active: true, lastLoginAt: today(8, 30) },
  { id: 'u-auditor', name: 'Budi Santoso', email: 'auditor@chatbot.test', roleId: 'auditor', title: 'Auditor Internal', active: true, lastLoginAt: today(10, 15) },
  { id: 'u-nonaktif', name: 'Rudi Hartono', email: 'nonaktif@chatbot.test', roleId: 'karyawan', title: 'Mantan Staf', active: false, lastLoginAt: daysAgo(40) },
  // Dummy users (no login, they only fill the user list)
  { id: 'u-d1', name: 'Putri Maharani', email: 'putri.maharani@chatbot.test', roleId: 'karyawan', title: 'Staf Pemasaran', active: true, lastLoginAt: daysAgo(1, 10, 4) },
  { id: 'u-d2', name: 'Fajar Siregar', email: 'fajar.siregar@chatbot.test', roleId: 'karyawan', title: 'Staf Gudang', active: true, lastLoginAt: daysAgo(2, 14, 40) },
  { id: 'u-d3', name: 'Lestari Ayu', email: 'lestari.ayu@chatbot.test', roleId: 'hr', title: 'Rekruter', active: true, lastLoginAt: daysAgo(1, 11, 12) },
  { id: 'u-d4', name: 'Hendra Wijaya', email: 'hendra.wijaya@chatbot.test', roleId: 'finance', title: 'Staf Akuntansi', active: true, lastLoginAt: daysAgo(5, 9, 33) },
  { id: 'u-d5', name: 'Maya Kusuma', email: 'maya.kusuma@chatbot.test', roleId: 'manajemen', title: 'Direktur Operasional', active: true, lastLoginAt: daysAgo(4, 8, 2) },
  { id: 'u-d6', name: 'Bayu Saputra', email: 'bayu.saputra@chatbot.test', roleId: 'karyawan', title: 'Staf IT Support', active: false, lastLoginAt: daysAgo(21) },
]

export const ROLE_NAMES: Record<RoleId, string> = {
  karyawan: 'Karyawan',
  hr: 'HR',
  finance: 'Finance',
  manajemen: 'Manajemen',
  admin: 'Admin',
  auditor: 'Auditor',
}

/* ------------------------------------------------------------------ */
/* Documents with chunks used by the mock retrieval                   */
/* ------------------------------------------------------------------ */

export interface MockChunk {
  location: string
  text: string
  keywords: string[]
}

export interface MockDocument extends DocumentItem {
  content: MockChunk[]
}

export const SEED_DOCUMENTS: MockDocument[] = [
  {
    id: 'doc-pp-2026', name: 'Peraturan Perusahaan 2026.pdf', format: 'PDF', sizeMb: 4.2, classification: 'HR', status: 'indexed', chunks: 412, uploadedBy: 'Admin Sistem', updatedAt: daysAgo(3),
    content: [
      { location: 'Bab IV · hal. 14', text: 'Karyawan tetap berhak atas 12 hari cuti tahunan setelah masa kerja 12 bulan. Sisa cuti maksimal 6 hari dapat dibawa ke tahun berikutnya dan harus digunakan paling lambat 31 Maret; lewat dari itu sisa cuti dianggap hangus.', keywords: ['cuti', 'tahunan', 'karyawan', 'tetap', 'sisa', 'hangus', 'libur'] },
      { location: 'Bab IV · hal. 16', text: 'Cuti melahirkan diberikan selama 3 bulan dengan gaji penuh. Cuti ayah diberikan 5 hari kerja.', keywords: ['cuti', 'melahirkan', 'ayah', 'hamil'] },
      { location: 'Bab VI · hal. 22', text: 'Jam kerja kantor adalah Senin sampai Jumat pukul 08.00–17.00 dengan istirahat satu jam. Kerja hybrid diizinkan maksimal 2 hari per minggu atas persetujuan atasan.', keywords: ['jam', 'kerja', 'hybrid', 'wfh', 'kantor', 'masuk'] },
    ],
  },
  {
    id: 'doc-portal-hr', name: 'Panduan Portal HR.pdf', format: 'PDF', sizeMb: 1.1, classification: 'Public', status: 'indexed', chunks: 86, uploadedBy: 'Admin Sistem', updatedAt: daysAgo(5),
    content: [
      { location: 'Bagian 2.3 · hal. 6', text: 'Pengajuan cuti dilakukan melalui portal HR minimal 7 hari kerja sebelum tanggal cuti dan harus disetujui atasan langsung.', keywords: ['cuti', 'pengajuan', 'portal', 'ajukan', 'izin'] },
      { location: 'Bagian 3.1 · hal. 9', text: 'Klaim reimburse diajukan lewat menu Klaim di portal HR dengan melampirkan bukti pembayaran paling lambat 30 hari setelah transaksi.', keywords: ['reimburse', 'klaim', 'penggantian', 'biaya'] },
    ],
  },
  {
    id: 'doc-lk-q3', name: 'Laporan Keuangan Q3 2026.pdf', format: 'PDF', sizeMb: 6.8, classification: 'Finance', status: 'indexed', chunks: 230, uploadedBy: 'Dimas Fajar', updatedAt: daysAgo(6),
    content: [
      { location: 'Ringkasan · hal. 2', text: 'Realisasi anggaran operasional Q3 2026 mencapai 87% dari rencana, dengan pendapatan naik 9% dibanding Q2.', keywords: ['realisasi', 'anggaran', 'q3', 'pendapatan', 'keuangan', 'laporan'] },
    ],
  },
  {
    id: 'doc-bonus-2026', name: 'Anggaran Bonus 2026.pdf', format: 'PDF', sizeMb: 0.9, classification: 'Finance', status: 'indexed', chunks: 44, uploadedBy: 'Dimas Fajar', updatedAt: daysAgo(7),
    content: [
      { location: 'Tabel 1 · hal. 3', text: 'Total anggaran bonus kinerja tahun 2026 ditetapkan sebesar 4,5% dari total biaya gaji, dibagi per divisi sesuai pencapaian KPI.', keywords: ['bonus', 'anggaran', 'insentif', 'kinerja', 'divisi'] },
    ],
  },
  {
    id: 'doc-akuisisi-x', name: 'Rencana Akuisisi Proyek X.pdf', format: 'PDF', sizeMb: 3.5, classification: 'Confidential', status: 'processing', progress: 62, chunks: null, uploadedBy: 'Admin Sistem', updatedAt: daysAgo(0),
    content: [
      { location: 'hal. 1', text: 'Proyek X adalah rencana akuisisi strategis yang ditargetkan selesai pada kuartal kedua 2027.', keywords: ['akuisisi', 'proyek', 'merger', 'strategis'] },
    ],
  },
  {
    id: 'doc-onboarding', name: 'SOP Onboarding Karyawan.docx', format: 'DOCX', sizeMb: 0.6, classification: 'Public', status: 'indexed', chunks: 58, uploadedBy: 'Rina Pratama', updatedAt: daysAgo(10),
    content: [
      { location: 'Langkah 1–3 · hal. 2', text: 'Pada hari pertama, karyawan baru menerima laptop dari tim IT, mengikuti orientasi budaya perusahaan, dan diperkenalkan kepada buddy dari timnya.', keywords: ['onboarding', 'karyawan', 'baru', 'hari', 'pertama', 'orientasi'] },
    ],
  },
  {
    id: 'doc-kebijakan-keamanan', name: 'Kebijakan Keamanan Informasi.pdf', format: 'PDF', sizeMb: 2.3, classification: 'Confidential', status: 'failed', error: 'Format PDF terenkripsi', chunks: null, uploadedBy: 'Admin Sistem', updatedAt: daysAgo(1),
    content: [],
  },
  {
    id: 'doc-libur-2026', name: 'Jadwal Libur Nasional 2026.pdf', format: 'PDF', sizeMb: 0.2, classification: 'Public', status: 'indexed', chunks: 12, uploadedBy: 'Rina Pratama', updatedAt: daysAgo(13),
    content: [
      { location: 'hal. 1', text: 'Tahun 2026 memiliki 17 hari libur nasional dan 7 hari cuti bersama. Cuti bersama memotong jatah cuti tahunan karyawan.', keywords: ['libur', 'nasional', 'cuti', 'bersama', 'tanggal', 'jadwal'] },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Conversation history for the HR test account                       */
/* ------------------------------------------------------------------ */

export const SEED_CONVERSATIONS: Record<string, Conversation[]> = {
  'u-hr': [
    {
      id: 'c-seed-1', title: 'Prosedur klaim reimburse', updatedAt: today(8, 40),
      messages: [
        { id: 'm-s1', role: 'user', content: 'Bagaimana cara mengajukan klaim reimburse?', createdAt: today(8, 39) },
        {
          id: 'm-s2', role: 'assistant', status: 'answered', createdAt: today(8, 40), latencyMs: 2100, feedback: null,
          content: 'Klaim reimburse diajukan lewat menu Klaim di portal HR dengan melampirkan bukti pembayaran paling lambat 30 hari setelah transaksi [1].',
          citations: [{ index: 1, documentId: 'doc-portal-hr', documentName: 'Panduan Portal HR.pdf', location: 'Bagian 3.1 · hal. 9', classification: 'Public', score: 0.88, snippet: 'Klaim reimburse diajukan lewat menu Klaim di portal HR…' }],
        },
      ],
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Audit log history (hashes are computed when the mock store starts) */
/* ------------------------------------------------------------------ */

export type SeedAudit = Omit<AuditEntry, 'id' | 'hash'>

export const SEED_AUDIT: SeedAudit[] = [
  { timestamp: daysAgo(1, 16, 2), actorName: 'Admin Sistem', actorRole: 'admin', action: 'DOC_UPLOAD', detail: 'Kebijakan Keamanan Informasi.pdf → klasifikasi Confidential', result: 'success' },
  { timestamp: today(8, 30), actorName: 'Admin Sistem', actorRole: 'admin', action: 'LOGIN', detail: 'Keycloak SSO · Chrome / Windows', result: 'success' },
  { timestamp: today(9, 1), actorName: 'Rina Pratama', actorRole: 'hr', action: 'LOGIN', detail: 'Keycloak SSO · Chrome / Windows', result: 'success' },
  { timestamp: today(9, 4), actorName: 'Rina Pratama', actorRole: 'hr', action: 'FEEDBACK', detail: 'Umpan balik positif pada jawaban #8812', result: 'success' },
  { timestamp: today(10, 15), actorName: 'Budi Santoso', actorRole: 'auditor', action: 'LOGIN', detail: 'Keycloak SSO · Chrome / Windows', result: 'success' },
  { timestamp: today(13, 12), actorName: 'Admin Sistem', actorRole: 'admin', action: 'ROLE_UPDATE', detail: 'Peran Manajemen diberi akses Confidential', result: 'success' },
  { timestamp: today(13, 47), actorName: '10.20.4.17', actorRole: null, action: 'PROMPT_INJECTION', detail: 'Pola "abaikan instruksi sebelumnya" terdeteksi pada input', result: 'blocked' },
  { timestamp: today(13, 58), actorName: 'Dimas Fajar', actorRole: 'finance', action: 'QUERY', detail: '"Realisasi anggaran Q3" · 1 sumber dikutip', result: 'success' },
  { timestamp: today(14, 20), actorName: 'Admin Sistem', actorRole: 'admin', action: 'DOC_UPLOAD', detail: 'Rencana Akuisisi Proyek X.pdf → klasifikasi Confidential', result: 'success' },
]

export const CLASSIFICATION_ORDER: Classification[] = ['Public', 'HR', 'Finance', 'Confidential']
