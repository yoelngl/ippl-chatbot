import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../types'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from './data'
import { createMockApi } from './mockApi'

const make = () => createMockApi({ latency: 0, persist: false })

describe('test accounts', () => {
  it.each(DEMO_ACCOUNTS.filter((a) => a.label !== 'Nonaktif'))('$label can log in', async (acc) => {
    const api = make()
    const s = await api.login(acc.email, DEMO_PASSWORD)
    expect(s.user.email).toBe(acc.email)
    expect(s.token).toBeTruthy()
  })

  it('rejects a wrong password', async () => {
    await expect(make().login('hr@chatbot.test', 'salah')).rejects.toMatchObject({ status: 401 })
  })

  it('rejects an inactive account', async () => {
    await expect(make().login('nonaktif@chatbot.test', DEMO_PASSWORD)).rejects.toMatchObject({ status: 403 })
  })

  it('has dummy users besides the login accounts', async () => {
    const api = make()
    await api.login('admin@chatbot.test', DEMO_PASSWORD)
    const users = await api.listUsers()
    expect(users.length).toBeGreaterThan(DEMO_ACCOUNTS.length)
  })
})

describe('permissions', () => {
  let api: ReturnType<typeof make>
  beforeEach(() => {
    api = make()
  })

  it('blocks admin endpoints for Karyawan', async () => {
    await api.login('karyawan@chatbot.test', DEMO_PASSWORD)
    await expect(api.listDocuments()).rejects.toBeInstanceOf(ApiError)
    await expect(api.listRoles()).rejects.toMatchObject({ status: 403 })
    await expect(api.listAudit()).rejects.toMatchObject({ status: 403 })
  })

  it('lets the Auditor read the log but not chat', async () => {
    await api.login('auditor@chatbot.test', DEMO_PASSWORD)
    const page = await api.listAudit()
    expect(page.total).toBeGreaterThan(0)
    await expect(api.ask(null, 'Bagaimana cara mengajukan cuti?')).rejects.toMatchObject({ status: 403 })
  })

  it('requires a session for chat', async () => {
    await expect(api.listConversations()).rejects.toMatchObject({ status: 401 })
  })
})

describe('chat and audit trail', () => {
  it('records answered and denied queries in the audit log', async () => {
    const api = make()
    await api.login('hr@chatbot.test', DEMO_PASSWORD)
    const ok = await api.ask(null, 'Berapa jatah cuti tahunan karyawan tetap?')
    expect(ok.message.status).toBe('answered')
    const denied = await api.ask(ok.conversation.id, 'Berapa total anggaran bonus 2026?')
    expect(denied.message.status).toBe('denied')
    expect(denied.conversation.messages).toHaveLength(4)

    await api.logout()
    await api.login('auditor@chatbot.test', DEMO_PASSWORD)
    const log = await api.listAudit({ action: 'QUERY_DENIED' })
    expect(log.items[0].actorName).toBe('Rina Pratama')
    expect((await api.verifyAuditChain()).ok).toBe(true)
  })

  it('saves feedback on an answer', async () => {
    const api = make()
    await api.login('karyawan@chatbot.test', DEMO_PASSWORD)
    const { message, conversation } = await api.ask(null, 'Bagaimana cara mengajukan cuti?')
    await api.sendFeedback(conversation.id, message.id, 'up')
    const conv = await api.getConversation(conversation.id)
    expect(conv.messages.at(-1)?.feedback).toBe('up')
  })
})

describe('documents and roles', () => {
  it('validates uploads and indexes new documents', async () => {
    const api = make()
    await api.login('admin@chatbot.test', DEMO_PASSWORD)
    await expect(api.uploadDocument({ name: 'gambar.png', sizeMb: 1, classification: 'Public' })).rejects.toMatchObject({ status: 422 })
    await expect(api.uploadDocument({ name: 'besar.pdf', sizeMb: 25, classification: 'Public' })).rejects.toMatchObject({ status: 413 })
    const doc = await api.uploadDocument({ name: 'SOP Baru.pdf', sizeMb: 1.2, classification: 'HR' })
    expect(doc.status).toBe('processing')
    for (let i = 0; i < 6; i++) await api.listDocuments()
    const after = (await api.listDocuments({ q: 'SOP Baru' }))[0]
    expect(after.status).toBe('indexed')
  })

  it('applies a role change to the next query', async () => {
    const api = make()
    await api.login('admin@chatbot.test', DEMO_PASSWORD)
    const hr = (await api.listRoles()).find((r) => r.id === 'hr')!
    await api.updateRole({ ...hr, classifications: [...hr.classifications, 'Finance'] })
    await api.logout()
    await api.login('hr@chatbot.test', DEMO_PASSWORD)
    const r = await api.ask(null, 'Berapa total anggaran bonus 2026?')
    expect(r.message.status).toBe('answered')
  })

  it('prevents an admin from changing their own role', async () => {
    const api = make()
    const s = await api.login('admin@chatbot.test', DEMO_PASSWORD)
    await expect(api.setUserRole(s.user.id, 'karyawan')).rejects.toMatchObject({ status: 422 })
  })
})
