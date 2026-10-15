import { Bot } from 'lucide-react'

export function Logo({ subtitle, inverse = true }: { subtitle?: string; inverse?: boolean }) {
  return (
    <div className={`logo ${inverse ? 'logo--inverse' : ''}`}>
      <span className="logo__mark" aria-hidden>
        <Bot size={18} />
      </span>
      <span className="logo__text">
        <span className="logo__name">Chatbot Cerdas &amp; Aman</span>
        {subtitle && <span className="logo__sub">{subtitle}</span>}
      </span>
    </div>
  )
}
