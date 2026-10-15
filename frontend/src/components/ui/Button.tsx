import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: ReactNode
  loading?: boolean
  block?: boolean
  size?: 'md' | 'lg'
}

export function Button({ variant = 'primary', icon, loading, block, size = 'md', className = '', children, disabled, ...rest }: Props) {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${block ? 'btn--block' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size={16} /> : icon}
      {children && <span>{children}</span>}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  tone?: 'default' | 'danger' | 'inverse'
  active?: boolean
}

export function IconButton({ label, tone = 'default', active, className = '', children, ...rest }: IconButtonProps) {
  return (
    <button aria-label={label} title={label} className={`icon-btn icon-btn--${tone} ${active ? 'is-active' : ''} ${className}`} {...rest}>
      {children}
    </button>
  )
}
