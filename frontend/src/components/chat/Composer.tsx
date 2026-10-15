import { Send, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

const MAX = 2000

export function Composer({ onSend, disabled }: { onSend(text: string): void; disabled?: boolean }) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }, [text])

  const send = () => {
    const t = text.trim()
    if (!t || disabled || t.length > MAX) return
    onSend(t)
    setText('')
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="composer-area">
      <div className="composer">
        <label htmlFor="composer-input" className="sr-only">
          Pertanyaan
        </label>
        <textarea
          id="composer-input"
          ref={ref}
          rows={1}
          value={text}
          maxLength={MAX}
          placeholder="Tanyakan sesuatu tentang dokumen internal…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
        />
        <button className="send-btn" aria-label="Kirim pertanyaan" onClick={send} disabled={disabled || !text.trim()}>
          <Send size={18} />
        </button>
      </div>
      <p className="composer-hint">
        <ShieldCheck size={14} aria-hidden />
        Jawaban hanya bersumber dari dokumen yang diizinkan untuk peran Anda. Periksa sitasi sebelum mengambil keputusan.
      </p>
    </div>
  )
}
