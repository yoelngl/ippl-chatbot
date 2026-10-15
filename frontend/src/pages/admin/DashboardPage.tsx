import { AlertTriangle, Bot, Clock, Cpu, Database, KeyRound, Lock, MessageSquare, RefreshCw, ThumbsUp, Upload, Users } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/layout/ConsoleLayout'
import { Badge, HealthBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { formatNumber } from '../../lib/format'
import { CLASSIFICATIONS, type DashboardStats } from '../../types/api'

const SERVICE_ICON: Record<string, ReactNode> = {
  api: <Cpu size={16} />,
  db: <Database size={16} />,
  llm: <Bot size={16} />,
  idp: <KeyRound size={16} />,
  ingest: <Upload size={16} />,
}

const CLASS_COLOR = { Public: 'var(--color-success)', HR: 'var(--color-info)', Finance: 'var(--color-warning)', Confidential: 'var(--color-danger)' }

export function DashboardPage() {
  const { api } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      setStats(await api.getDashboard())
      setError(null)
    } catch {
      setError('Gagal memuat dasbor.')
    } finally {
      setRefreshing(false)
    }
  }, [api])

  useEffect(() => {
    void load()
  }, [load])

  if (error && !stats) return <div className="page"><div className="alert alert--error">{error}</div></div>
  if (!stats) return <div className="page center-pad"><Spinner /></div>

  const allHealthy = stats.services.every((s) => s.health !== 'down')
  const maxDocs = Math.max(...Object.values(stats.documentsByClassification), 1)
  const TARGET = 5
  const maxY = 6

  return (
    <div className="page">
      <PageHeader title="Dasbor Kesehatan Sistem" subtitle="Pantau layanan, kinerja kueri, dan umpan balik pengguna.">
        <Badge tone={allHealthy ? 'success' : 'warning'}>{allHealthy ? 'Semua layanan berjalan' : 'Ada layanan perlu perhatian'}</Badge>
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={load} loading={refreshing}>
          Muat ulang
        </Button>
      </PageHeader>

      <div className="stats">
        <Stat icon={<MessageSquare size={16} />} tone="primary" label="Kueri hari ini" value={formatNumber(stats.queriesToday)} note={`+${stats.queriesDeltaPct}% dari kemarin`} noteTone="success" />
        <Stat icon={<Clock size={16} />} tone="success" label="Waktu respons p95" value={`${stats.p95LatencySec.toLocaleString('id-ID')} dtk`} note={stats.p95LatencySec < TARGET ? `Target < ${TARGET} dtk · tercapai` : `Target < ${TARGET} dtk · terlewati`} noteTone={stats.p95LatencySec < TARGET ? 'success' : 'danger'} />
        <Stat icon={<Users size={16} />} tone="info" label="Pengguna aktif" value={formatNumber(stats.activeUsers)} note={`Uji kapasitas: ${stats.capacityUsers} pengguna`} />
        <Stat icon={<ThumbsUp size={16} />} tone="purple" label="Umpan balik positif" value={`${stats.positiveFeedbackPct}%`} note={`${stats.feedbackPositive} dari ${stats.feedbackCount} penilaian`} />
      </div>

      <div className="grid-2">
        <section className="card card--pad" aria-labelledby="latency-title">
          <div className="card__head">
            <div>
              <h2 id="latency-title" className="h-m">Latensi kueri p95</h2>
              <p className="text-small text-muted">24 jam terakhir · per jam</p>
            </div>
            <div className="legend">
              <span><i style={{ background: 'var(--color-primary)' }} /> p95 (dtk)</span>
              <span><i style={{ background: 'var(--color-warning)' }} /> Target {TARGET} dtk</span>
            </div>
          </div>
          <div className="bars" role="img" aria-label={`Grafik latensi p95 per jam. Nilai tertinggi ${Math.max(...stats.latencySeries).toLocaleString('id-ID')} detik, semua di bawah target ${TARGET} detik.`}>
            <div className="bars__target" style={{ bottom: `${(TARGET / maxY) * 100}%` }} />
            {stats.latencySeries.map((v, i) => (
              <div
                key={i}
                className={`bars__bar ${i === stats.latencySeries.length - 1 ? 'is-current' : ''}`}
                style={{ height: `${(v / maxY) * 100}%` }}
                title={`${String(i).padStart(2, '0')}:00 · ${v.toLocaleString('id-ID')} dtk`}
              />
            ))}
          </div>
          <div className="axis">
            {['00:00', '06:00', '12:00', '18:00', 'Sekarang'].map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </section>

        <section className="card card--pad side-card" aria-labelledby="svc-title">
          <h2 id="svc-title" className="h-m">Status layanan</h2>
          <ul className="list">
            {stats.services.map((s) => (
              <li key={s.id} className="list__row">
                <span className="icon-box">{SERVICE_ICON[s.id] ?? <Cpu size={16} />}</span>
                <span className="list__text">
                  <span className="text-body-medium">{s.name}</span>
                  <span className="text-small text-muted">{s.detail}</span>
                </span>
                <HealthBadge health={s.health} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid-2">
        <section className="card card--pad" aria-labelledby="class-title">
          <div className="card__head">
            <h2 id="class-title" className="h-m">Dokumen per klasifikasi</h2>
            <span className="text-small text-muted">Total {Object.values(stats.documentsByClassification).reduce((a, b) => a + b, 0)} dokumen</span>
          </div>
          <ul className="hbars">
            {CLASSIFICATIONS.map((c) => (
              <li key={c}>
                <span className="hbars__label">{c}</span>
                <span className="hbars__track">
                  <span className="hbars__fill" style={{ width: `${(stats.documentsByClassification[c] / maxDocs) * 100}%`, background: CLASS_COLOR[c] }} />
                </span>
                <span className="hbars__value">{stats.documentsByClassification[c]}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card card--pad side-card" aria-labelledby="sec-title">
          <h2 id="sec-title" className="h-m">Kejadian keamanan · hari ini</h2>
          <ul className="list list--tight">
            <SecRow icon={<AlertTriangle size={16} />} tone="danger" text={`${stats.security.promptInjections} percobaan prompt injection diblokir`} />
            <SecRow icon={<Lock size={16} />} tone="warning" text={`${stats.security.rbacDenials} kueri ditolak filter RBAC`} />
            <SecRow icon={<KeyRound size={16} />} tone="info" text={`${stats.security.failedLogins} login gagal`} />
          </ul>
          <p className="text-small text-muted">Detail kejadian dapat ditinjau Auditor di log audit.</p>
        </section>
      </div>
    </div>
  )
}

function Stat({ icon, tone, label, value, note, noteTone }: { icon: ReactNode; tone: string; label: string; value: string; note: string; noteTone?: 'success' | 'danger' }) {
  return (
    <div className="card card--pad stat">
      <div className="stat__label">
        <span className={`icon-box icon-box--${tone}`}>{icon}</span>
        {label}
      </div>
      <div className="display">{value}</div>
      <div className={`text-small-medium ${noteTone ? `text-${noteTone}` : 'text-muted'}`}>{note}</div>
    </div>
  )
}

function SecRow({ icon, tone, text }: { icon: ReactNode; tone: string; text: string }) {
  return (
    <li className="list__row">
      <span className={`icon-box icon-box--${tone}`}>{icon}</span>
      <span>{text}</span>
    </li>
  )
}

