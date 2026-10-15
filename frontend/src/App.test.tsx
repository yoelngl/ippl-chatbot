import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { createMockApi } from './api/mock/mockApi'
import { App } from './App'
import { AuthProvider } from './auth/AuthContext'
import { ToastProvider } from './components/ui/Toast'

function renderApp(path: string, api = createMockApi({ latency: 0 })) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <AuthProvider api={api}>
          <App />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
  return api
}

describe('App', () => {
  it('sends logged-out users to the login page', async () => {
    renderApp('/chat')
    expect(await screen.findByRole('heading', { name: 'Masuk ke akun Anda' })).toBeInTheDocument()
  })

  it('shows an error for a wrong password', async () => {
    renderApp('/login')
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Email atau username'), 'hr@chatbot.test')
    await user.type(screen.getByLabelText('Kata sandi'), 'salah')
    await user.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Email atau kata sandi salah')
  })

  it('logs in with a test account and answers a question with citations', async () => {
    renderApp('/login')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Masuk sebagai HR (hr@chatbot.test)' }))
    expect(await screen.findByText(/Ada yang bisa dibantu/)).toBeInTheDocument()

    await user.type(screen.getByLabelText('Pertanyaan'), 'Berapa jatah cuti tahunan karyawan tetap?{Enter}')
    expect(await screen.findByText('Peraturan Perusahaan 2026.pdf')).toBeInTheDocument()
    expect(screen.getByText('Sumber (1)')).toBeInTheDocument()
  })

  it('shows the RBAC denial card for a restricted question', async () => {
    const api = createMockApi({ latency: 0 })
    await api.login('karyawan@chatbot.test', 'demo123')
    renderApp('/chat', api)
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Pertanyaan'), 'Berapa total anggaran bonus 2026?{Enter}')
    expect(await screen.findByText('Informasi tidak tersedia untuk peran Anda')).toBeInTheDocument()
    expect(screen.getByText('Klasifikasi: Finance')).toBeInTheDocument()
  })

  it('blocks Karyawan from the admin console', async () => {
    const api = createMockApi({ latency: 0 })
    await api.login('karyawan@chatbot.test', 'demo123')
    renderApp('/admin', api)
    expect(await screen.findByRole('heading', { name: 'Akses ditolak' })).toBeInTheDocument()
  })

  it('takes the Auditor straight to the read-only audit log', async () => {
    const api = createMockApi({ latency: 0 })
    await api.login('auditor@chatbot.test', 'demo123')
    renderApp('/', api)
    expect(await screen.findByRole('heading', { name: 'Log Audit' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Integritas log terverifikasi')).toBeInTheDocument())
  })

  it('logs out through the confirmation dialog', async () => {
    const api = createMockApi({ latency: 0 })
    await api.login('hr@chatbot.test', 'demo123')
    renderApp('/chat', api)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Keluar' }))
    expect(screen.getByRole('dialog', { name: 'Keluar dari sesi?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ya, keluar' }))
    expect(await screen.findByText('Anda telah keluar. Sampai jumpa lagi.')).toBeInTheDocument()
  })
})
