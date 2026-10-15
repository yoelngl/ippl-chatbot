import { Check, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/layout/ConsoleLayout'
import { Avatar } from '../../components/ui/Avatar'
import { Badge, ROLE_TONE } from '../../components/ui/Badge'
import { FilterSelect } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import { TextField } from '../../components/ui/TextField'
import { useToast } from '../../components/ui/Toast'
import { formatRelativeDay } from '../../lib/format'
import { CLASSIFICATIONS, type Classification, type Role, type RoleId, type User } from '../../types/api'

type Perm = Classification | 'canManageDocuments' | 'canManageRoles' | 'canViewAuditLog'

const COLUMNS: { key: Perm; label: string }[] = [
  ...CLASSIFICATIONS.map((c) => ({ key: c as Perm, label: c })),
  { key: 'canManageDocuments', label: 'Kelola dokumen' },
  { key: 'canManageRoles', label: 'Kelola peran' },
  { key: 'canViewAuditLog', label: 'Lihat log audit' },
]

const has = (r: Role, p: Perm) => (CLASSIFICATIONS.includes(p as Classification) ? r.classifications.includes(p as Classification) : Boolean(r[p as keyof Role]))

function toggle(r: Role, p: Perm): Role {
  if (CLASSIFICATIONS.includes(p as Classification)) {
    const c = p as Classification
    const next = r.classifications.includes(c) ? r.classifications.filter((x) => x !== c) : [...r.classifications, c]
    return { ...r, classifications: CLASSIFICATIONS.filter((x) => next.includes(x)) }
  }
  const key = p as 'canManageDocuments' | 'canManageRoles' | 'canViewAuditLog'
  return { ...r, [key]: !r[key] }
}

export function RolesPage() {
  const { api, session } = useAuth()
  const toast = useToast()
  const [roles, setRoles] = useState<Role[] | null>(null)
  const [users, setUsers] = useState<User[] | null>(null)
  const [q, setQ] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  const loadRoles = useCallback(async () => setRoles(await api.listRoles()), [api])
  useEffect(() => void loadRoles(), [loadRoles])
  useEffect(() => {
    const t = setTimeout(() => void api.listUsers(q).then(setUsers), 200)
    return () => clearTimeout(t)
  }, [api, q])

  const roleName = useMemo(() => Object.fromEntries((roles ?? []).map((r) => [r.id, r.name])) as Record<RoleId, string>, [roles])

  const onToggle = async (role: Role, p: Perm) => {
    const next = toggle(role, p)
    const key = `${role.id}:${p}`
    setSaving(key)
    setRoles((rs) => rs?.map((r) => (r.id === role.id ? next : r)) ?? rs)
    try {
      await api.updateRole(next)
      const col = COLUMNS.find((c) => c.key === p)!.label
      toast(`${role.name}: ${col} ${has(next, p) ? 'diizinkan' : 'dicabut'}.`, 'success')
    } catch (err) {
      setRoles((rs) => rs?.map((r) => (r.id === role.id ? role : r)) ?? rs)
      toast(err instanceof ApiError ? err.message : 'Gagal menyimpan perubahan.', 'error')
    } finally {
      setSaving(null)
      void loadRoles()
    }
  }

  const changeRole = async (u: User, roleId: RoleId) => {
    try {
      const updated = await api.setUserRole(u.id, roleId)
      setUsers((us) => us?.map((x) => (x.id === u.id ? updated : x)) ?? us)
      toast(`${u.name} sekarang berperan ${roleName[roleId]}.`, 'success')
      void loadRoles()
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Gagal mengubah peran.', 'error')
    }
  }

  const changeActive = async (u: User) => {
    try {
      const updated = await api.setUserActive(u.id, !u.active)
      setUsers((us) => us?.map((x) => (x.id === u.id ? updated : x)) ?? us)
      toast(`${u.name} ${updated.active ? 'diaktifkan' : 'dinonaktifkan'}.`, 'success')
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Gagal mengubah status.', 'error')
    }
  }

  return (
    <div className="page">
      <PageHeader title="Peran & Izin" subtitle="Atur peran pengguna dan klasifikasi dokumen yang boleh diakses setiap peran (RBAC)." />

      <section aria-labelledby="matrix-title" className="section">
        <div className="section__head">
          <h2 id="matrix-title" className="h-m">Matriks akses per peran</h2>
          <p className="text-small text-muted">
            Klik sel untuk mengubah izin. Klasifikasi dipakai sebagai filter metadata saat similarity search di pgvector; perubahan berlaku pada kueri berikutnya.
          </p>
        </div>
        <div className="table-wrap">
          <table className="table table--matrix">
            <thead>
              <tr>
                <th>Peran</th>
                <th className="num">Pengguna</th>
                {COLUMNS.map((c) => (
                  <th key={c.key} className="center">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!roles && (
                <tr><td colSpan={COLUMNS.length + 2} className="center-pad"><Spinner /></td></tr>
              )}
              {roles?.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="cell-role">
                      <span className={`dot dot--${ROLE_TONE[r.id]}`} aria-hidden />
                      <span className="cell-doc__text">
                        <span className="text-body-semibold">{r.name}</span>
                        <span className="text-small text-muted">{r.description}</span>
                      </span>
                    </div>
                  </td>
                  <td className="num">{r.userCount}</td>
                  {COLUMNS.map((c) => {
                    const on = has(r, c.key)
                    const self = r.id === session?.role.id && c.key === 'canManageRoles'
                    return (
                      <td key={c.key} className="center">
                        <button
                          className={`perm ${on ? 'is-on' : ''}`}
                          aria-label={`${c.label} untuk ${r.name}`}
                          aria-pressed={on}
                          disabled={saving !== null || self}
                          title={self ? 'Tidak dapat mencabut izin ini dari peran Anda sendiri' : undefined}
                          onClick={() => onToggle(r, c.key)}
                        >
                          {on ? <Check size={14} /> : <span aria-hidden>—</span>}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="users-title" className="section">
        <div className="section__head section__head--row">
          <div>
            <h2 id="users-title" className="h-m">Pengguna</h2>
            <p className="text-small text-muted">{users ? `${users.length} pengguna` : 'Memuat…'} · disinkronkan dari Keycloak</p>
          </div>
          <TextField label="Cari pengguna" hideLabel placeholder="Cari nama atau email…" icon={<Search size={18} />} value={q} onChange={(e) => setQ(e.target.value)} className="search-sm" />
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Peran</th>
                <th>Status</th>
                <th>Login terakhir</th>
              </tr>
            </thead>
            <tbody>
              {!users && (
                <tr><td colSpan={4} className="center-pad"><Spinner /></td></tr>
              )}
              {users?.length === 0 && (
                <tr><td colSpan={4} className="table__empty">Tidak ada pengguna yang cocok.</td></tr>
              )}
              {users?.map((u) => {
                const self = u.id === session?.user.id
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="cell-doc">
                        <Avatar name={u.name} />
                        <span className="cell-doc__text">
                          <span className="text-body-medium">{u.name}{self && <span className="text-muted"> (Anda)</span>}</span>
                          <span className="text-small text-muted">{u.email}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      {self ? (
                        <Badge tone={ROLE_TONE[u.roleId]}>{roleName[u.roleId] ?? u.roleId}</Badge>
                      ) : (
                        <FilterSelect label={`Peran ${u.name}`} value={u.roleId} onChange={(e) => changeRole(u, e.target.value as RoleId)} options={(roles ?? []).map((r) => ({ value: r.id, label: r.name }))} />
                      )}
                    </td>
                    <td>
                      <button className={`switch ${u.active ? 'is-on' : ''}`} role="switch" aria-checked={u.active} aria-label={`Akun ${u.name} aktif`} disabled={self} onClick={() => changeActive(u)}>
                        <span className="switch__knob" />
                        <span className="switch__label">{u.active ? 'Aktif' : 'Nonaktif'}</span>
                      </button>
                    </td>
                    <td>{u.lastLoginAt ? formatRelativeDay(u.lastLoginAt) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
