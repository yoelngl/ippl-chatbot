import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose(): void
  labelledBy: string
  children: ReactNode
  width?: number
}

/** Accessible dialog: traps focus on open, closes on Escape and backdrop click. */
export function Modal({ open, onClose, labelledBy, children, width = 440 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const first = ref.current?.querySelector<HTMLElement>('button, [href], input, select, textarea')
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && ref.current) {
        const items = ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea')
        if (!items.length) return
        const firstEl = items[0]
        const lastEl = items[items.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus()
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy} style={{ width }}>
        {children}
      </div>
    </div>
  )
}
