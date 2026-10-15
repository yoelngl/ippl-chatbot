export function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size <= 28 ? 11 : 12 }} aria-hidden>
      {initials(name)}
    </span>
  )
}
