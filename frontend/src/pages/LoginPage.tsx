import { BookOpen, ClipboardList, Eye, EyeOff, KeyRound, Lock, Shield, ShieldCheck, User as UserIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { API_MODE } from '../api'
import { ApiError } from '../api/types'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../api/mock/data'
import { homePathFor, useAuth } from '../auth/AuthContext'
import { Logo } from '../components/layout/Logo'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { useToast } from '../components/ui/Toast'

const FEATURES = [
  { icon: <BookOpen size={16} />, text: 'Setiap jawaban disertai sitasi sumber dokumen' },
  { icon: <Shield size={16} />, text: 'Akses dibatasi per peran (RBAC): Public, HR, Finance, Confidential' },
  { icon: <ClipboardList size={16} />, text: 'Semua kueri tercatat di log audit yang tidak dapat diubah' },
]

export function LoginPage() {
  const { session, login, justLoggedOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const state = (location.state ?? {}) as { from?: string }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to={homePathFor(session.role)} replace />

  const submit = async (e?: FormEvent, override?: { email: string; password: string }) => {
    e?.preventDefault()
    const creds = override ?? { email, password }
    if (!creds.email.trim() || !creds.password) {
      setError('Isi email dan kata sandi terlebih dahulu.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const s = await login(creds.email, creds.password)
      const back = !justLoggedOut && state.from && state.from !== '/login' ? state.from : null
      navigate(back ?? homePathFor(s.role), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  const signInAs = (accEmail: string) => {
    setEmail(accEmail)
    setPassword(DEMO_PASSWORD)
    void submit(undefined, { email: accEmail, password: DEMO_PASSWORD })
  }

  return (
    <div className="login">
      <section className="login__brand">
        <Logo />
        <div className="login__hero">
          <h1 className="display">
            Tanya dokumen internal.
            <br />
            Dapat jawaban bersitasi.
          </h1>
          <p className="login__lead">
            Asisten berbasis RAG yang menjawab dari dokumen perusahaan, hanya dari dokumen yang boleh Anda akses sesuai peran.
          </p>
          <ul className="login__features">
            {FEATURES.map((f) => (
              <li key={f.text}>
                <span className="login__feature-icon" aria-hidden>
                  {f.icon}
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="login__foot">Program Studi Teknik Informatika · Universitas Telkom · 2026</p>
      </section>

      <section className="login__form-area">
        <div className="login__stack">
          <div className="login__mobile-logo">
            <Logo inverse={false} />
          </div>
          <form className="card login__card" onSubmit={submit} noValidate>
            <div>
              <h2 className="h-l">Masuk ke akun Anda</h2>
              <p className="text-muted">Gunakan akun perusahaan yang dikelola Keycloak.</p>
            </div>
            {justLoggedOut && !error && <div className="alert alert--success">Anda telah keluar. Sampai jumpa lagi.</div>}
            {error && (
              <div className="alert alert--error" role="alert">
                {error}
              </div>
            )}
            <TextField
              label="Email atau username"
              type="email"
              autoComplete="username"
              placeholder="nama@perusahaan.co.id"
              icon={<UserIcon size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Kata sandi"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              trailing={
                <button type="button" className="field__toggle" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            <div className="login__options">
              <label className="checkbox">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span>Ingat saya</span>
              </label>
              <button type="button" className="link" onClick={() => toast('Atur ulang kata sandi dilakukan melalui Keycloak. Hubungi Admin.', 'info')}>
                Lupa kata sandi?
              </button>
            </div>
            <Button type="submit" size="lg" block loading={busy}>
              Masuk
            </Button>
            <div className="divider">
              <span>atau</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              block
              icon={<KeyRound size={18} />}
              onClick={() =>
                API_MODE === 'mock'
                  ? toast('SSO Keycloak aktif setelah backend tersambung. Gunakan akun uji di bawah.', 'info')
                  : (window.location.href = `${import.meta.env.VITE_API_URL ?? '/api'}/auth/sso`)
              }
            >
              Masuk dengan SSO Keycloak
            </Button>
            <div className="note">
              <ShieldCheck size={16} aria-hidden />
              <span>Sesi diamankan token JWT. Aktivitas login dicatat di log audit.</span>
            </div>
          </form>

          {API_MODE === 'mock' && (
            <div className="card demo-accounts" aria-labelledby="demo-title">
              <div className="demo-accounts__head">
                <h3 id="demo-title" className="h-m">
                  Akun uji
                </h3>
                <span className="text-small text-muted">
                  Kata sandi semua akun: <code>{DEMO_PASSWORD}</code>
                </span>
              </div>
              <ul className="demo-accounts__list">
                {DEMO_ACCOUNTS.map((a) => (
                  <li key={a.email}>
                    <button type="button" className="demo-account" onClick={() => signInAs(a.email)} disabled={busy} aria-label={`Masuk sebagai ${a.label} (${a.email})`}>
                      <span className="demo-account__role">{a.label}</span>
                      <span className="demo-account__email">{a.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
