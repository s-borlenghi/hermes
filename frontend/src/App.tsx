import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { NotificationsProvider } from './components/Notifications'
import { WakeUpGate } from './components/WakeUpGate'
import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { ApplicationDetail } from './pages/ApplicationDetail'
import { Applications } from './pages/Applications'
import { Companies } from './pages/Companies'
import { Dashboard } from './pages/Dashboard'
import { Demo } from './pages/Demo'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'

export default function App() {
  return (
    <WakeUpGate>
      <HashRouter>
        <NotificationsProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/app" element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route index element={<Dashboard />} />
                  <Route path="applications" element={<Applications />} />
                  <Route path="applications/:id" element={<ApplicationDetail />} />
                  <Route path="companies" element={<Companies />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </NotificationsProvider>
      </HashRouter>
    </WakeUpGate>
  )
}
