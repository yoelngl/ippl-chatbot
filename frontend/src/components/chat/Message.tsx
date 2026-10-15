import { AlertTriangle, BookOpen, Bot, Clock, Copy, Lock, SearchX, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import type { ChatMessage } from '../../types/api'
import { formatSeconds, formatTime } from '../../lib/format'
import { Badge, ClassificationBadge } from '../ui/Badge'
import { IconButton } from '../ui/Button'
import { AnswerText } from './AnswerText'

export function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="msg msg--user">
      <div className="bubble">{message.content}</div>
    </div>
  )
}

interface BotProps {
  message: ChatMessage
  roleName: string
  onFeedback(value: 'up' | 'down' | null): void
  onCopy(): void
}

export function BotMessage({ message, roleName, onFeedback, onCopy }: BotProps) {
  const [highlight, setHighlight] = useState<number | null>(null)
  const cite = (n: number) => {
    setHighlight(n)
    document.getElementById(`cite-${message.id}-${n}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
    setTimeout(() => setHighlight(null), 1600)
  }

  return (
    <div className="msg msg--bot">
      <span className="bot-avatar" aria-hidden>
        <Bot size={16} />
      </span>
      <div className="msg__body">
        {message.status === 'answered' && (
          <div className="answer-card">
            <AnswerText text={message.content} onCite={cite} />
            {!!message.citations?.length && (
              <>
                <div className="sources-label">
                  <BookOpen size={14} aria-hidden /> Sumber ({message.citations.length})
                </div>
                <ul className="citations">
                  {message.citations.map((c) => (
                    <li key={c.index} id={`cite-${message.id}-${c.index}`} className={`citation ${highlight === c.index ? 'is-highlight' : ''}`}>
                      <span className="citation__num">{c.index}</span>
                      <span className="citation__doc">
                        <span className="citation__name">{c.documentName}</span>
                        <span className="citation__meta">
                          {c.location} · Relevansi {c.score.toLocaleString('id-ID', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                        </span>
                      </span>
                      <ClassificationBadge value={c.classification} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {message.status === 'denied' && (
          <div className="answer-card answer-card--warning">
            <div className="answer-card__title">
              <Lock size={16} aria-hidden /> Informasi tidak tersedia untuk peran Anda
            </div>
            <p>{message.content}</p>
            <div className="tags">
              {message.deniedClassification && <ClassificationBadge value={message.deniedClassification} prefix="Klasifikasi: " />}
              <Badge tone="neutral" dot={false}>
                Dicatat di log audit
              </Badge>
            </div>
          </div>
        )}

        {message.status === 'blocked' && (
          <div className="answer-card answer-card--danger">
            <div className="answer-card__title">
              <AlertTriangle size={16} aria-hidden /> Pertanyaan diblokir
            </div>
            <p>{message.content}</p>
            <div className="tags">
              <Badge tone="danger">Prompt injection terdeteksi</Badge>
              <Badge tone="neutral" dot={false}>
                Dicatat di log audit
              </Badge>
            </div>
          </div>
        )}

        {message.status === 'not_found' && (
          <div className="answer-card answer-card--muted">
            <div className="answer-card__title">
              <SearchX size={16} aria-hidden /> Tidak ditemukan di dokumen
            </div>
            <p>{message.content}</p>
            <span className="text-small text-muted">Pencarian hanya mencakup dokumen yang diizinkan untuk peran {roleName}.</span>
          </div>
        )}

        {message.status === 'answered' && (
          <div className="feedback-row">
            <span className="text-small text-muted">Apakah jawaban ini membantu?</span>
            <IconButton label="Jawaban membantu" active={message.feedback === 'up'} className="fb-up" aria-pressed={message.feedback === 'up'} onClick={() => onFeedback(message.feedback === 'up' ? null : 'up')}>
              <ThumbsUp size={16} />
            </IconButton>
            <IconButton label="Jawaban tidak membantu" active={message.feedback === 'down'} className="fb-down" aria-pressed={message.feedback === 'down'} onClick={() => onFeedback(message.feedback === 'down' ? null : 'down')}>
              <ThumbsDown size={16} />
            </IconButton>
            <IconButton label="Salin jawaban" onClick={onCopy}>
              <Copy size={16} />
            </IconButton>
            <span className="feedback-row__spacer" />
            <span className="meta">
              <Clock size={14} aria-hidden />
              {message.latencyMs != null ? `Dijawab dalam ${formatSeconds(message.latencyMs)} · ` : ''}
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="msg msg--bot">
      <span className="bot-avatar" aria-hidden>
        <Bot size={16} />
      </span>
      <div className="typing" role="status" aria-label="Chatbot sedang mencari di dokumen">
        <span />
        <span />
        <span />
        <span className="typing__label">Mencari di dokumen yang diizinkan…</span>
      </div>
    </div>
  )
}
