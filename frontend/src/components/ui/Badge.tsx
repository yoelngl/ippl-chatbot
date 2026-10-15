import type { ReactNode } from 'react'
import type { Classification, IndexStatus, RoleId, AuditResult, ServiceHealth } from '../../types/api'

export type Tone = 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'purple' | 'primary'

export function Badge({ tone, children, dot = true }: { tone: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`badge badge--${tone}`}>
      {dot && <span className="badge__dot" aria-hidden />}
      {children}
    </span>
  )
}

export const CLASSIFICATION_TONE: Record<Classification, Tone> = {
  Public: 'success',
  HR: 'info',
  Finance: 'warning',
  Confidential: 'danger',
}

export const ROLE_TONE: Record<RoleId, Tone> = {
  karyawan: 'success',
  hr: 'info',
  finance: 'warning',
  manajemen: 'purple',
  admin: 'primary',
  auditor: 'neutral',
}

export function ClassificationBadge({ value, prefix }: { value: Classification; prefix?: string }) {
  return <Badge tone={CLASSIFICATION_TONE[value]}>{prefix ? `${prefix}${value}` : value}</Badge>
}

export function IndexStatusBadge({ status, progress }: { status: IndexStatus; progress?: number }) {
  if (status === 'indexed') return <Badge tone="success">Terindeks</Badge>
  if (status === 'processing') return <Badge tone="purple">Memproses {progress ?? 0}%</Badge>
  return <Badge tone="primary">Gagal</Badge>
}

export function AuditResultBadge({ result }: { result: AuditResult }) {
  if (result === 'success') return <Badge tone="success">Berhasil</Badge>
  if (result === 'denied') return <Badge tone="warning">Ditolak</Badge>
  return <Badge tone="danger">Diblokir</Badge>
}

export function HealthBadge({ health }: { health: ServiceHealth }) {
  if (health === 'healthy') return <Badge tone="success">Sehat</Badge>
  if (health === 'busy') return <Badge tone="warning">Sibuk</Badge>
  return <Badge tone="danger">Gangguan</Badge>
}
