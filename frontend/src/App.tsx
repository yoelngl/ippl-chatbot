import { Navigate, Route, Routes } from 'react-router-dom'
import { canAdmin, canAudit, canChat, homePathFor, useAuth } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { ConsoleLayout } from './components/layout/ConsoleLayout'
import { FullPageSpinner } from './components/ui/Spinner'
import { ChatPage } from './pages/ChatPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { DocumentsPage } from './pages/admin/DocumentsPage'
import { RolesPage } from './pages/admin/RolesPage'
import { AuditLogPage } from './pages/auditor/AuditLogPage'

function Home() {
  const { session, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  return <Navigate to={session ? homePathFor(session.role) : '/login'} replace />
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/chat" element={<RequireAuth allow={canChat}><ChatPage /></RequireAuth>} />
      <Route path="/chat/:conversationId" element={<RequireAuth allow={canChat}><ChatPage /></RequireAuth>} />
      <Route element={<RequireAuth allow={canAdmin}><ConsoleLayout /></RequireAuth>}>
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/admin/documents" element={<RequireAuth allow={(r) => r.canManageDocuments}><DocumentsPage /></RequireAuth>} />
        <Route path="/admin/roles" element={<RequireAuth allow={(r) => r.canManageRoles}><RolesPage /></RequireAuth>} />
      </Route>
      <Route element={<RequireAuth allow={canAudit}><ConsoleLayout /></RequireAuth>}>
        <Route path="/audit" element={<AuditLogPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
