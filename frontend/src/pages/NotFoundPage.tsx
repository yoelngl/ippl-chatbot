import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="full-page-center">
      <div className="card card--pad state-card">
        <h1 className="h-l">Halaman tidak ditemukan</h1>
        <p className="text-muted">Alamat yang Anda buka tidak ada.</p>
        <Link className="btn btn--primary btn--md" to="/">
          Ke halaman utama
        </Link>
      </div>
    </div>
  )
}
