import { ShieldX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { homePathFor, useAuth } from '../auth/AuthContext'

export function ForbiddenPage() {
  const { session } = useAuth()
  return (
    <div className="full-page-center">
      <div className="card card--pad state-card">
        <span className="dialog__icon dialog__icon--danger" aria-hidden>
          <ShieldX size={22} />
        </span>
        <h1 className="h-l">Akses ditolak</h1>
        <p className="text-muted">Peran {session?.role.name ?? 'Anda'} tidak memiliki izin untuk membuka halaman ini.</p>
        <Link className="btn btn--primary btn--md" to={session ? homePathFor(session.role) : '/login'}>
          Kembali ke halaman utama
        </Link>
      </div>
    </div>
  )
}
