import { Download, Lock, Search, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { AuditFilter } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/layout/ConsoleLayout'
import { Avatar } from '../../components/ui/Avatar'
import { AuditResultBadge, Badge, ROLE_TONE } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { FilterSelect } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import { TextField } from '../../components/ui/TextField'
import { useToast } from '../../components/ui/Toast'
import { ROLE_NAMES } from '../../api/mock/data'
import { formatDate, formatNumber, formatTimeSec } from '../../lib/format'
import type { AuditAction, AuditEntry, AuditResult, RoleId } from '../../types/api'

const PAGE_SIZE = 10
const ACTIONS: AuditAction[] = ['LOGIN', 'LOGOUT', 'QUERY', 'QUERY_DENIED', 'PROMPT_INJECTION', 'FEEDBACK', 'DOC_UPLOAD', 'DOC_RECLASSIFY', 'DOC_DELETE', 'ROLE_UPDATE']

export function AuditLogPage() {
  const { api } = useAuth()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [role, setRole] = useState<RoleId | 'all'>('all')
  const [action, setAction] = useState<AuditAction | 'all'>('all')
  const [result, setResult] = useState<AuditResult | 'all'>('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: AuditEntry[]; total: number } | null>(null)
  const [verify, setVerify] = useState<{ ok: boolean; count: number; checkedAt: string } | null>(null)
  const [verifying, setVerifying] = useState(false)

  const filter: AuditFilter = { q, role, action, result, page, pageSize: PAGE_SIZE }

  const load = useCallback(async (f: AuditFilter) => setData(await api.listAudit(f)), [api])

  useEffect(() => {
    const t = setTimeout(() => void load(filter), 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, q, role, action, result, page])

  useEffect(() => setPage(1), [q, role, action, result])

  const runVerify = useCallback(async () => {
    setVerifying(true)
    try {
      setVerify(await api.verifyAuditChain())
    } finally {
      setVerifying(false)
    }
  }, [api])

  useEffect(() => void runVerify(), [runVerify])

  const exportCsv = async () => {
    const all = await api.listAudit({ ...filter, page: 1, pageSize: 100_000 })
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const rows = [
      ['Waktu', 'Pengguna', 'Peran', 'Aksi', 'Detail', 'Hasil', 'Hash'],
      ...all.items.map((e) => [e.timestamp, e.actorName, e.actorRole ? ROLE_NAMES[e.actorRole] : '-', e.action, e.detail, e.result, e.hash]),
    ]
    const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `log-audit-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast(`${all.items.length} entri diekspor ke CSV.`, 'success')
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <div className="page">
      <PageHeader
        title="Log Audit"
        subtitle="Catatan aktivitas append-only: entri tidak dapat diubah atau dihapus oleh peran mana pun."
        badge={<Badge tone="neutral" dot={false}><Lock size={12} aria-hidden /> Hanya baca</Badge>}
      >
        <Button variant="secondary" icon={<Download size={16} />} onClick={exportCsv}>
          Ekspor CSV
        </Button>
      </PageHeader>

      <div className={`banner ${verify && !verify.ok ? 'banner--danger' : 'banner--success'}`} role="status">
        <span className="banner__icon">{verify && !verify.ok ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}</span>
        <span className="banner__text">
          {!verify ? (
            <strong>Memeriksa integritas log…</strong>
          ) : verify.ok ? (
            <>
              <strong>Integritas log terverifikasi</strong>
              <span>Rantai hash utuh untuk {formatNumber(verify.count)} entri · pemeriksaan terakhir {formatDate(verify.checkedAt)}, {formatTimeSec(verify.checkedAt)}</span>
            </>
          ) : (
            <>
              <strong>Rantai hash tidak cocok</strong>
              <span>Ada entri yang berubah sejak dicatat. Laporkan ke tim keamanan.</span>
            </>
          )}
        </span>
        <button className="link-strong" onClick={runVerify} disabled={verifying}>
          {verifying ? 'Memeriksa…' : 'Verifikasi ulang'}
        </button>
      </div>

      <div className="filter-bar">
        <TextField label="Cari log" hideLabel placeholder="Cari pengguna, aksi, atau detail…" icon={<Search size={18} />} value={q} onChange={(e) => setQ(e.target.value)} className="filter-bar__search" />
        <FilterSelect label="Peran" value={role} onChange={(e) => setRole(e.target.value as RoleId | 'all')} options={[{ value: 'all', label: 'Peran: Semua' }, ...Object.entries(ROLE_NAMES).map(([v, l]) => ({ value: v, label: l }))]} />
        <FilterSelect label="Aksi" value={action} onChange={(e) => setAction(e.target.value as AuditAction | 'all')} options={[{ value: 'all', label: 'Aksi: Semua' }, ...ACTIONS.map((a) => ({ value: a, label: a }))]} />
        <FilterSelect label="Hasil" value={result} onChange={(e) => setResult(e.target.value as AuditResult | 'all')} options={[{ value: 'all', label: 'Hasil: Semua' }, { value: 'success', label: 'Berhasil' }, { value: 'denied', label: 'Ditolak' }, { value: 'blocked', label: 'Diblokir' }]} />
        <span className="filter-bar__spacer" />
        <span className="text-small-medium text-muted">{data ? `${formatNumber(data.total)} entri` : ''}</span>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Pengguna</th>
              <th>Peran</th>
              <th>Aksi</th>
              <th>Detail</th>
              <th>Hasil</th>
              <th>Hash</th>
            </tr>
          </thead>
          <tbody>
            {!data && (
              <tr><td colSpan={7} className="center-pad"><Spinner /></td></tr>
            )}
            {data?.items.length === 0 && (
              <tr><td colSpan={7} className="table__empty">Tidak ada entri yang cocok dengan filter.</td></tr>
            )}
            {data?.items.map((e) => (
              <tr key={e.id}>
                <td className="nowrap">
                  <span className="cell-doc__text">
                    <span className="text-body-medium">{formatTimeSec(e.timestamp)}</span>
                    <span className="text-small text-muted">{formatDate(e.timestamp)}</span>
                  </span>
                </td>
                <td>
                  <div className="cell-doc">
                    <Avatar name={e.actorRole ? e.actorName : '?'} size={28} />
                    <span>{e.actorName}</span>
                  </div>
                </td>
                <td>{e.actorRole ? <Badge tone={ROLE_TONE[e.actorRole]}>{ROLE_NAMES[e.actorRole]}</Badge> : <Badge tone="neutral">—</Badge>}</td>
                <td><code className="tag">{e.action}</code></td>
                <td className="cell-detail" title={e.detail}>{e.detail}</td>
                <td><AuditResultBadge result={e.result} /></td>
                <td><code className="hash">{e.hash}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="text-small text-muted pagination__info">
          <Lock size={14} aria-hidden /> Log disimpan append-only dengan rantai hash
        </span>
        <div className="pages">
          <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Halaman sebelumnya">‹</button>
          <span className="text-small text-muted">Halaman {page} dari {totalPages}</span>
          <button className="page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="Halaman berikutnya">›</button>
        </div>
      </div>
    </div>
  )
}
