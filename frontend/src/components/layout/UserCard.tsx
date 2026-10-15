import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Avatar } from '../ui/Avatar'
import { IconButton } from '../ui/Button'
import { LogoutDialog } from './LogoutDialog'

export function UserCard() {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  if (!session) return null
  return (
    <>
      <div className="user-card">
        <Avatar name={session.user.name} />
        <div className="user-card__info">
          <span className="user-card__name">{session.user.name}</span>
          <span className="user-card__role" title={`${session.user.title} · Peran: ${session.role.name}`}>
            Peran: {session.role.name}
          </span>
        </div>
        <IconButton label="Keluar" tone="inverse" onClick={() => setOpen(true)}>
          <LogOut size={16} />
        </IconButton>
      </div>
      <LogoutDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}
