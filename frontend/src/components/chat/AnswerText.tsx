import { Fragment } from 'react'

/** Renders answer text and turns "[n]" markers into citation chips. */
export function AnswerText({ text, onCite }: { text: string; onCite?(index: number): void }) {
  const parts = text.split(/(\[\d+\])/g)
  return (
    <p className="answer-text">
      {parts.map((p, i) => {
        const m = /^\[(\d+)\]$/.exec(p)
        if (!m) return <Fragment key={i}>{p}</Fragment>
        const n = Number(m[1])
        return (
          <button key={i} type="button" className="cite-marker" onClick={() => onCite?.(n)} aria-label={`Lihat sumber ${n}`}>
            [{n}]
          </button>
        )
      })}
    </p>
  )
}
