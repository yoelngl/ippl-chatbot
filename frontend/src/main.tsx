import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/inter'
import './styles/tokens.css'
import './styles/global.css'
import { api } from './api'
import { App } from './App'
import { AuthProvider } from './auth/AuthContext'
import { ToastProvider } from './components/ui/Toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider api={api}>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
