import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string; label: string }[]
}

/** Pill-shaped select used in filter bars. The label is read by screen readers. */
export function FilterSelect({ label, options, className = '', ...rest }: Props) {
  return (
    <label className={`filter-select ${className}`}>
      <span className="sr-only">{label}</span>
      <select {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden />
    </label>
  )
}
