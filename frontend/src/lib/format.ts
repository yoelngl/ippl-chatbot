const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' })
const timeSecFmt = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export const formatDate = (iso: string) => dateFmt.format(new Date(iso))
export const formatTime = (iso: string) => timeFmt.format(new Date(iso)).replace('.', ':')
export const formatTimeSec = (iso: string) => timeSecFmt.format(new Date(iso)).replace(/\./g, ':')

export function formatRelativeDay(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((startOf(now) - startOf(d)) / 86_400_000)
  if (diff === 0) return `Hari ini, ${formatTime(iso)}`
  if (diff === 1) return `Kemarin, ${formatTime(iso)}`
  return formatDate(iso)
}

export type HistoryGroup = 'Hari ini' | '7 hari terakhir' | 'Lebih lama'

export function historyGroup(iso: string, now = new Date()): HistoryGroup {
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const t = new Date(iso).getTime()
  if (t >= startToday) return 'Hari ini'
  if (t >= startToday - 7 * 86_400_000) return '7 hari terakhir'
  return 'Lebih lama'
}

export const formatNumber = (n: number) => n.toLocaleString('id-ID')
export const formatSeconds = (ms: number) => `${(ms / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} dtk`
