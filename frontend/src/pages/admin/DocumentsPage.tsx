import { Database, FileText, Pencil, Search, Trash2, Upload } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { ApiError } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/layout/ConsoleLayout'
import { ClassificationBadge, IndexStatusBadge } from '../../components/ui/Badge'
import { Button, IconButton } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { FilterSelect } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import { TextField } from '../../components/ui/TextField'
import { useToast } from '../../components/ui/Toast'
import { formatDate } from '../../lib/format'
import { CLASSIFICATIONS, type Classification, type DocumentItem, type IndexStatus } from '../../types/api'

const PAGE_SIZE = 8

export function DocumentsPage() {
  const { api } = useAuth()
  const toast = useToast()
  const [docs, setDocs] = useState<DocumentItem[] | null>(null)
  const [all, setAll] = useState<DocumentItem[]>([])
  const [q, setQ] = useState('')
  const [cls, setCls] = useState<Classification | 'all'>('all')
  const [status, setStatus] = useState<IndexStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [defaultClass, setDefaultClass] = useState<Classification>('Public')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [editing, setEditing] = useState<DocumentItem | null>(null)
  const [deleting, setDeleting] = useState<DocumentItem | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const [filtered, everything] = await Promise.all([api.listDocuments({ q, classification: cls, status }), api.listDocuments()])
    setDocs(filtered)
    setAll(everything)
  }, [api, q, cls, status])

  useEffect(() => {
    const t = setTimeout(() => void load(), 200)
    return () => clearTimeout(t)
  }, [load])

  // Keep polling while something is being indexed.
  useEffect(() => {
    if (!all.some((d) => d.status === 'processing')) return
    const t = setInterval(() => void load(), 2500)
    return () => clearInterval(t)
  }, [all, load])

  useEffect(() => setPage(1), [q, cls, status])

  const counts = (c: Classification | 'all') => (c === 'all' ? all.length : all.filter((d) => d.classification === c).length)

  const pickFiles = (files: FileList | null) => {
    if (!files?.length) return
    setPendingFiles(Array.from(files))
    setUploadOpen(true)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    pickFiles(e.dataTransfer.files)
  }

  const reindex = async () => {
    await api.reindexAll()
    toast('Indeks ulang dimulai untuk dokumen yang gagal.', 'info')
    void load()
  }

  const totalPages = Math.max(1, Math.ceil((docs?.length ?? 0) / PAGE_SIZE))
  const visible = docs?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? []

  return (
    <div className="page">
      <PageHeader title="Kelola Dokumen" subtitle="Unggah dokumen, tetapkan klasifikasi akses, dan pantau status indeks embedding.">
        <Button variant="secondary" icon={<Database size={16} />} onClick={reindex}>
          Indeks ulang
        </Button>
        <Button icon={<Upload size={16} />} onClick={() => fileRef.current?.click()}>
          Unggah dokumen
        </Button>
      </PageHeader>

      <input ref={fileRef} type="file" accept=".pdf,.docx" multiple hidden onChange={(e) => { pickFiles(e.target.files); e.target.value = '' }} data-testid="file-input" />

      <div
        className={`dropzone ${dragOver ? 'is-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <span className="icon-box icon-box--primary icon-box--lg"><Upload size={20} /></span>
        <div className="dropzone__text">
          <button type="button" className="link-strong" onClick={() => fileRef.current?.click()}>
            Seret file PDF atau DOCX ke sini, atau pilih file
          </button>
          <span className="text-small text-muted">Maks. 20 MB per file · Dokumen di-chunk, diberi metadata klasifikasi, lalu di-embed ke pgvector</span>
        </div>
        <FilterSelect label="Klasifikasi default" value={defaultClass} onChange={(e) => setDefaultClass(e.target.value as Classification)} options={CLASSIFICATIONS.map((c) => ({ value: c, label: `Default: ${c}` }))} />
      </div>

      <div className="filter-bar">
        <TextField label="Cari dokumen" hideLabel placeholder="Cari nama dokumen…" icon={<Search size={18} />} value={q} onChange={(e) => setQ(e.target.value)} className="filter-bar__search" />
        <div className="chips" role="group" aria-label="Filter klasifikasi">
          {(['all', ...CLASSIFICATIONS] as const).map((c) => (
            <button key={c} className={`chip ${cls === c ? 'is-active' : ''}`} aria-pressed={cls === c} onClick={() => setCls(c)}>
              {c === 'all' ? 'Semua' : c} · {counts(c)}
            </button>
          ))}
        </div>
        <span className="filter-bar__spacer" />
        <FilterSelect label="Status indeks" value={status} onChange={(e) => setStatus(e.target.value as IndexStatus | 'all')} options={[{ value: 'all', label: 'Status: Semua' }, { value: 'indexed', label: 'Terindeks' }, { value: 'processing', label: 'Memproses' }, { value: 'failed', label: 'Gagal' }]} />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Nama dokumen</th>
              <th>Klasifikasi</th>
              <th>Status indeks</th>
              <th className="num">Chunk</th>
              <th>Diunggah oleh</th>
              <th>Diperbarui</th>
              <th className="actions-col"><span className="sr-only">Aksi</span></th>
            </tr>
          </thead>
          <tbody>
            {docs === null && (
              <tr><td colSpan={7} className="center-pad"><Spinner /></td></tr>
            )}
            {docs?.length === 0 && (
              <tr><td colSpan={7} className="table__empty">Tidak ada dokumen yang cocok dengan filter.</td></tr>
            )}
            {visible.map((d) => (
              <tr key={d.id}>
                <td>
                  <div className="cell-doc">
                    <span className="icon-box"><FileText size={16} /></span>
                    <span className="cell-doc__text">
                      <span className="text-body-medium">{d.name}</span>
                      <span className="text-small text-muted">{d.format} · {d.sizeMb.toLocaleString('id-ID')} MB</span>
                    </span>
                  </div>
                </td>
                <td><ClassificationBadge value={d.classification} /></td>
                <td>
                  <IndexStatusBadge status={d.status} progress={d.progress} />
                  {d.error && <span className="text-small text-muted cell-sub">{d.error}</span>}
                </td>
                <td className="num">{d.chunks ?? '—'}</td>
                <td>{d.uploadedBy}</td>
                <td>{formatDate(d.updatedAt)}</td>
                <td className="actions-col">
                  <IconButton label={`Ubah klasifikasi ${d.name}`} onClick={() => setEditing(d)}><Pencil size={16} /></IconButton>
                  <IconButton label={`Hapus ${d.name}`} tone="danger" onClick={() => setDeleting(d)}><Trash2 size={16} /></IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="text-small text-muted">
          {docs?.length ? `Menampilkan ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, docs.length)} dari ${docs.length} dokumen` : ''}
        </span>
        <div className="pages">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`page-btn ${p === page ? 'is-active' : ''}`} aria-current={p === page ? 'page' : undefined} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <UploadDialog open={uploadOpen} files={pendingFiles} defaultClass={defaultClass} onClose={() => setUploadOpen(false)} onDone={() => { setUploadOpen(false); void load() }} />
      <ReclassifyDialog doc={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); void load() }} />
      <DeleteDialog doc={deleting} onClose={() => setDeleting(null)} onDone={() => { setDeleting(null); void load() }} />
    </div>
  )
}

function UploadDialog({ open, files, defaultClass, onClose, onDone }: { open: boolean; files: File[]; defaultClass: Classification; onClose(): void; onDone(): void }) {
  const { api } = useAuth()
  const toast = useToast()
  const [cls, setCls] = useState<Classification>(defaultClass)
  const [busy, setBusy] = useState(false)
  useEffect(() => setCls(defaultClass), [defaultClass, open])

  const submit = async () => {
    setBusy(true)
    let ok = 0
    for (const f of files) {
      try {
        await api.uploadDocument({ name: f.name, sizeMb: f.size / 1_048_576, classification: cls })
        ok++
      } catch (err) {
        toast(`${f.name}: ${err instanceof ApiError ? err.message : 'gagal diunggah'}`, 'error')
      }
    }
    setBusy(false)
    if (ok) toast(`${ok} dokumen diunggah dan sedang diindeks.`, 'success')
    onDone()
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="upload-title" width={480}>
      <div className="dialog">
        <h2 id="upload-title" className="h-l">Unggah {files.length} dokumen</h2>
        <ul className="file-list">
          {files.map((f) => (
            <li key={f.name}>
              <FileText size={16} aria-hidden />
              <span>{f.name}</span>
              <span className="text-small text-muted">{(f.size / 1_048_576).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB</span>
            </li>
          ))}
        </ul>
        <ClassPicker value={cls} onChange={setCls} />
        <div className="dialog__actions">
          <Button variant="secondary" block onClick={onClose} disabled={busy}>Batal</Button>
          <Button block icon={<Upload size={16} />} onClick={submit} loading={busy}>Unggah</Button>
        </div>
      </div>
    </Modal>
  )
}

function ReclassifyDialog({ doc, onClose, onDone }: { doc: DocumentItem | null; onClose(): void; onDone(): void }) {
  const { api } = useAuth()
  const toast = useToast()
  const [cls, setCls] = useState<Classification>('Public')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (doc) setCls(doc.classification) }, [doc])

  const submit = async () => {
    if (!doc) return
    setBusy(true)
    try {
      await api.reclassifyDocument(doc.id, cls)
      toast(`Klasifikasi ${doc.name} diubah ke ${cls}.`, 'success')
      onDone()
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Gagal mengubah klasifikasi.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={!!doc} onClose={onClose} labelledBy="reclass-title" width={480}>
      <div className="dialog">
        <div>
          <h2 id="reclass-title" className="h-l">Ubah klasifikasi</h2>
          <p className="text-muted">{doc?.name}</p>
        </div>
        <ClassPicker value={cls} onChange={setCls} />
        <div className="dialog__actions">
          <Button variant="secondary" block onClick={onClose} disabled={busy}>Batal</Button>
          <Button block onClick={submit} loading={busy} disabled={cls === doc?.classification}>Simpan</Button>
        </div>
      </div>
    </Modal>
  )
}

function DeleteDialog({ doc, onClose, onDone }: { doc: DocumentItem | null; onClose(): void; onDone(): void }) {
  const { api } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    if (!doc) return
    setBusy(true)
    try {
      await api.deleteDocument(doc.id)
      toast(`${doc.name} dihapus.`, 'success')
      onDone()
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Gagal menghapus dokumen.', 'error')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open={!!doc} onClose={onClose} labelledBy="del-title">
      <div className="dialog">
        <span className="dialog__icon dialog__icon--danger" aria-hidden><Trash2 size={22} /></span>
        <div className="dialog__text">
          <h2 id="del-title" className="h-l">Hapus dokumen?</h2>
          <p className="text-muted">
            <strong>{doc?.name}</strong> dan {doc?.chunks ?? 0} chunk embedding-nya akan dihapus dari pgvector. Chatbot tidak akan lagi mengutip dokumen ini.
          </p>
        </div>
        <div className="dialog__actions">
          <Button variant="secondary" block onClick={onClose} disabled={busy}>Batal</Button>
          <Button variant="danger" block icon={<Trash2 size={16} />} onClick={submit} loading={busy}>Hapus</Button>
        </div>
      </div>
    </Modal>
  )
}

const CLASS_HELP: Record<Classification, string> = {
  Public: 'Informasi umum untuk semua karyawan',
  HR: 'Data dan kebijakan kepegawaian',
  Finance: 'Data anggaran dan keuangan',
  Confidential: 'Rahasia, akses paling terbatas',
}

function ClassPicker({ value, onChange }: { value: Classification; onChange(c: Classification): void }) {
  return (
    <fieldset className="class-picker">
      <legend className="field__label">Klasifikasi akses</legend>
      {CLASSIFICATIONS.map((c) => (
        <label key={c} className={`class-option ${value === c ? 'is-active' : ''}`}>
          <input type="radio" name="classification" value={c} checked={value === c} onChange={() => onChange(c)} />
          <ClassificationBadge value={c} />
          <span className="text-small text-muted">{CLASS_HELP[c]}</span>
        </label>
      ))}
    </fieldset>
  )
}
