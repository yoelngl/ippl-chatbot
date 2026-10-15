import { LogOut, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

export function LogoutDialog({ open, onClose }: { open: boolean; onClose(): void }) {
  const { logout } = useAuth()
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    // Clearing the session unmounts this page; the route guard then redirects to /login.
    await logout()
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="logout-title">
      <div className="dialog">
        <span className="dialog__icon dialog__icon--danger" aria-hidden>
          <LogOut size={22} />
        </span>
        <div className="dialog__text">
          <h2 id="logout-title" className="h-l">
            Keluar dari sesi?
          </h2>
          <p className="text-muted">
            Token sesi Anda akan dicabut di Keycloak dan Anda perlu login kembali untuk bertanya. Riwayat percakapan tetap tersimpan
            sesuai kebijakan retensi.
          </p>
        </div>
        <div className="note">
          <ShieldCheck size={16} aria-hidden />
          <span>Aktivitas logout dicatat di log audit.</span>
        </div>
        <div className="dialog__actions">
          <Button variant="secondary" block onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button variant="primary" block icon={<LogOut size={18} />} onClick={confirm} loading={busy}>
            Ya, keluar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
