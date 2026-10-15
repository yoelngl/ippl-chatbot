import { Bot, Cpu, Menu, MessageSquare, Plus, Settings2, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/types'
import { canAdmin, canAudit, useAuth } from '../auth/AuthContext'
import { BotMessage, TypingIndicator, UserBubble } from '../components/chat/Message'
import { Composer } from '../components/chat/Composer'
import { Logo } from '../components/layout/Logo'
import { UserCard } from '../components/layout/UserCard'
import { Badge } from '../components/ui/Badge'
import { Button, IconButton } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'
import { historyGroup, type HistoryGroup } from '../lib/format'
import type { ChatMessage, Classification, Conversation } from '../types/api'

const SUGGESTIONS: { text: string; needs: Classification }[] = [
  { text: 'Bagaimana cara mengajukan cuti?', needs: 'Public' },
  { text: 'Berapa jatah cuti tahunan untuk karyawan tetap?', needs: 'HR' },
  { text: 'Berapa realisasi anggaran Q3 2026?', needs: 'Finance' },
  { text: 'Apa saja yang terjadi di hari pertama karyawan baru?', needs: 'Public' },
]

const GROUP_ORDER: HistoryGroup[] = ['Hari ini', '7 hari terakhir', 'Lebih lama']

export function ChatPage() {
  const { session, api } = useAuth()
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [title, setTitle] = useState('Percakapan baru')
  const [loadingConv, setLoadingConv] = useState(false)
  const [pending, setPending] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)

  const role = session!.role

  const refreshHistory = useCallback(async () => {
    try {
      setConversations(await api.listConversations())
    } finally {
      setHistoryLoading(false)
    }
  }, [api])

  useEffect(() => {
    void refreshHistory()
  }, [refreshHistory])

  // Load the selected conversation (or reset for a new one).
  useEffect(() => {
    setDrawer(false)
    if (!conversationId) {
      setMessages([])
      setTitle('Percakapan baru')
      return
    }
    let cancelled = false
    setLoadingConv(true)
    api
      .getConversation(conversationId)
      .then((c) => {
        if (cancelled) return
        setMessages(c.messages)
        setTitle(c.title)
      })
      .catch((err) => {
        if (cancelled) return
        toast(err instanceof ApiError ? err.message : 'Gagal memuat percakapan.', 'error')
        navigate('/chat', { replace: true })
      })
      .finally(() => !cancelled && setLoadingConv(false))
    return () => {
      cancelled = true
    }
  }, [conversationId, api, navigate, toast])

  useEffect(() => {
    const el = threadRef.current
    if (el && typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, pending])

  const ask = async (text: string) => {
    const optimistic: ChatMessage = { id: `tmp-${Date.now()}`, role: 'user', content: text, createdAt: new Date().toISOString() }
    setMessages((m) => [...m, optimistic])
    setPending(true)
    try {
      const { conversation } = await api.ask(conversationId ?? null, text)
      setMessages(conversation.messages)
      setTitle(conversation.title)
      if (!conversationId) navigate(`/chat/${conversation.id}`, { replace: true })
      void refreshHistory()
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id))
      toast(err instanceof ApiError ? err.message : 'Gagal mengirim pertanyaan.', 'error')
    } finally {
      setPending(false)
    }
  }

  const feedback = async (msg: ChatMessage, value: 'up' | 'down' | null) => {
    if (!conversationId) return
    setMessages((ms) => ms.map((m) => (m.id === msg.id ? { ...m, feedback: value } : m)))
    try {
      await api.sendFeedback(conversationId, msg.id, value)
      if (value) toast('Terima kasih atas umpan baliknya.', 'success')
    } catch {
      setMessages((ms) => ms.map((m) => (m.id === msg.id ? { ...m, feedback: msg.feedback } : m)))
      toast('Umpan balik gagal dikirim.', 'error')
    }
  }

  const copy = async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content.replace(/\s?\[\d+\]/g, ''))
      toast('Jawaban disalin.', 'success')
    } catch {
      toast('Tidak dapat menyalin ke clipboard.', 'error')
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Hapus percakapan ini dari riwayat?')) return
    try {
      await api.deleteConversation(id)
      await refreshHistory()
      if (id === conversationId) navigate('/chat')
      toast('Percakapan dihapus.', 'success')
    } catch {
      toast('Gagal menghapus percakapan.', 'error')
    }
  }

  const grouped = useMemo(() => {
    const g = new Map<HistoryGroup, Conversation[]>()
    for (const c of conversations) {
      const k = historyGroup(c.updatedAt)
      g.set(k, [...(g.get(k) ?? []), c])
    }
    return GROUP_ORDER.filter((k) => g.has(k)).map((k) => [k, g.get(k)!] as const)
  }, [conversations])

  const accessLabel = `Akses: ${role.classifications.join(' · ')}`
  const suggestions = SUGGESTIONS.filter((s) => s.needs === 'Public' || role.classifications.includes(s.needs)).slice(0, 3)
  // Always include one question the role cannot answer, to show RBAC in action.
  const deniedDemo = SUGGESTIONS.find((s) => !role.classifications.includes(s.needs))
  const shownSuggestions = deniedDemo ? [...suggestions.slice(0, 2), deniedDemo] : suggestions

  return (
    <div className="chat">
      <aside className={`sidebar sidebar--chat ${drawer ? 'is-open' : ''}`} aria-label="Riwayat percakapan">
        <div className="sidebar__top">
          <Logo />
          <button className="icon-btn icon-btn--inverse sidebar__close" aria-label="Tutup menu" onClick={() => setDrawer(false)}>
            <X size={18} />
          </button>
        </div>
        <Button icon={<Plus size={18} />} block onClick={() => navigate('/chat')}>
          Percakapan baru
        </Button>
        <nav className="history">
          {historyLoading && (
            <div className="history__empty">
              <Spinner size={16} />
            </div>
          )}
          {!historyLoading && !conversations.length && <p className="history__empty">Belum ada percakapan.</p>}
          {grouped.map(([group, items]) => (
            <div key={group} className="history__group">
              <span className="history__label">{group}</span>
              {items.map((c) => (
                <div key={c.id} className={`history__item ${c.id === conversationId ? 'is-active' : ''}`}>
                  <Link to={`/chat/${c.id}`} className="history__link">
                    <MessageSquare size={16} aria-hidden />
                    <span>{c.title}</span>
                  </Link>
                  <button className="history__delete" aria-label={`Hapus percakapan ${c.title}`} onClick={() => remove(c.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </nav>
        {(canAdmin(role) || canAudit(role)) && (
          <Link to={canAdmin(role) ? '/admin' : '/audit'} className="nav-item">
            <Settings2 size={18} />
            <span>{canAdmin(role) ? 'Konsol Admin' : 'Konsol Auditor'}</span>
          </Link>
        )}
        <UserCard />
      </aside>
      {drawer && <div className="drawer-backdrop" onClick={() => setDrawer(false)} />}

      <main className="chat__main">
        <header className="chat__top">
          <IconButton label="Buka riwayat" className="chat__menu" onClick={() => setDrawer(true)}>
            <Menu size={20} />
          </IconButton>
          <h1 className="h-m chat__title">{title}</h1>
          <Badge tone="info">{accessLabel}</Badge>
          <span className="model-chip">
            <Cpu size={14} aria-hidden /> Llama 3 · Ollama
          </span>
        </header>

        <div className="chat__thread" ref={threadRef}>
          <div className="chat__column">
            {loadingConv && (
              <div className="center-pad">
                <Spinner />
              </div>
            )}
            {!loadingConv && messages.length === 0 && !pending && (
              <div className="empty-chat">
                <span className="empty-chat__icon" aria-hidden>
                  <Bot size={28} />
                </span>
                <h2 className="h-l">Halo, {session!.user.name.split(' ')[0]}. Ada yang bisa dibantu?</h2>
                <p className="text-muted">
                  Saya menjawab dari dokumen internal yang boleh diakses peran <strong>{role.name}</strong> ({role.classifications.join(', ')}),
                  lengkap dengan sitasi sumbernya.
                </p>
                <div className="suggestions">
                  {shownSuggestions.map((s) => (
                    <button key={s.text} className="suggestion" onClick={() => ask(s.text)}>
                      {s.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) =>
              m.role === 'user' ? (
                <UserBubble key={m.id} message={m} />
              ) : (
                <BotMessage key={m.id} message={m} roleName={role.name} onFeedback={(v) => feedback(m, v)} onCopy={() => copy(m)} />
              ),
            )}
            {pending && <TypingIndicator />}
          </div>
        </div>

        <Composer onSend={ask} disabled={pending} />
      </main>
    </div>
  )
}
