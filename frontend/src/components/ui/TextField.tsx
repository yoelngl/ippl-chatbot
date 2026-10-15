import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: ReactNode
  trailing?: ReactNode
  error?: string
  hideLabel?: boolean
}

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, icon, trailing, error, hideLabel, className = '', id, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={hideLabel ? 'sr-only' : 'field__label'}>
          {label}
        </label>
      )}
      <div className="field__box">
        {icon && <span className="field__icon">{icon}</span>}
        <input ref={ref} id={inputId} aria-invalid={!!error || undefined} {...rest} />
        {trailing}
      </div>
      {error && <span className="field__error">{error}</span>}
    </div>
  )
})
