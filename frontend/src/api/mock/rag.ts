// A tiny keyword "retriever" that imitates the backend RAG flow:
// sanitize input → retrieve chunks → filter by role (RBAC) → answer with citations.
// It exists so the UI can be demoed and tested before FastAPI + LlamaIndex is ready.
import type { Citation, Classification } from '../../types/api'
import type { MockDocument } from './data'

const INJECTION_PATTERNS: RegExp[] = [
  /abaikan (semua )?(instruksi|perintah)/i,
  /ignore (all |any )?(previous|prior|above) (instructions|prompts?)/i,
  /system prompt/i,
  /kamu sekarang (adalah|berperan)/i,
  /you are now/i,
  /tampilkan (semua )?dokumen (rahasia|confidential)/i,
  /bypass|jailbreak/i,
]

export function detectPromptInjection(question: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(question))
}

const STOPWORDS = new Set([
  'apa', 'apakah', 'berapa', 'bagaimana', 'cara', 'yang', 'dan', 'atau', 'untuk', 'bisa', 'dapat', 'di', 'ke',
  'dari', 'ini', 'itu', 'ada', 'saya', 'kami', 'kita', 'dengan', 'pada', 'dalam', 'tahun', 'jika', 'kalau',
  'mohon', 'tolong', 'jelaskan', 'tentang', 'berikutnya', 'boleh', 'harus', 'sudah', 'akan', 'the', 'is', 'how',
])

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
}

export interface Hit {
  doc: MockDocument
  chunkIndex: number
  score: number
}

/** Score every chunk of every indexed document against the question. */
export function retrieve(question: string, docs: MockDocument[]): Hit[] {
  const tokens = tokenize(question)
  if (tokens.length === 0) return []
  const hits: Hit[] = []
  for (const doc of docs) {
    if (doc.status !== 'indexed') continue
    doc.content.forEach((chunk, chunkIndex) => {
      let score = 0
      for (const t of tokens) {
        if (chunk.keywords.includes(t)) score += 2
        else if (t.length >= 4 && chunk.keywords.some((k) => k.startsWith(t) || t.startsWith(k))) score += 1
      }
      if (score >= 2) hits.push({ doc, chunkIndex, score })
    })
  }
  return hits.sort((a, b) => b.score - a.score)
}

export type RagOutcome =
  | { kind: 'answered'; content: string; citations: Citation[] }
  | { kind: 'denied'; classification: Classification }
  | { kind: 'blocked' }
  | { kind: 'not_found' }

/**
 * Full mock RAG pipeline. `allowed` is the list of classifications the user's
 * role may read; documents outside it are never used in the answer.
 */
export function answerQuestion(question: string, docs: MockDocument[], allowed: Classification[]): RagOutcome {
  if (detectPromptInjection(question)) return { kind: 'blocked' }

  const all = retrieve(question, docs)
  const permitted = all.filter((h) => allowed.includes(h.doc.classification))

  if (permitted.length === 0) {
    const restricted = all.find((h) => !allowed.includes(h.doc.classification))
    return restricted ? { kind: 'denied', classification: restricted.doc.classification } : { kind: 'not_found' }
  }

  // Top-K = 3 chunks, keeping only chunks that score close to the best one.
  const best = permitted[0].score
  const top = permitted.filter((h) => h.score >= best - 2).slice(0, 3)

  const citations: Citation[] = []
  const sentences: string[] = []
  for (const hit of top) {
    let citation = citations.find((c) => c.documentId === hit.doc.id && c.location === hit.doc.content[hit.chunkIndex].location)
    if (!citation) {
      const chunk = hit.doc.content[hit.chunkIndex]
      citation = {
        index: citations.length + 1,
        documentId: hit.doc.id,
        documentName: hit.doc.name,
        location: chunk.location,
        classification: hit.doc.classification,
        score: Math.min(0.97, 0.6 + hit.score * 0.06),
        snippet: chunk.text.length > 120 ? chunk.text.slice(0, 117) + '…' : chunk.text,
      }
      citations.push(citation)
    }
    sentences.push(`${hit.doc.content[hit.chunkIndex].text} [${citation.index}]`)
  }

  return { kind: 'answered', content: sentences.join(' '), citations }
}
