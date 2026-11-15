import { Fragment } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useLang } from './hooks/usePrefs'
import { useApp } from './contexts/AppContext'
import { Role } from './types'
import AppLayout from './layouts/AppLayout'
import { Landing, Login, Register } from './pages/auth/AuthPages'
import * as A from './pages/admin/AdminPages'
import * as C from './pages/organization/OrganizationPages'
import TrainingEditor from './features/trainings/TrainingEditor'
import * as E from './pages/user/UserPages'
import Learning from './features/learning/Learning'
import Billing from './features/billing/Billing'
import Analytics from './pages/organization/AnalyticsPage'
import ForcePassword from './features/authentication/ForcePassword'

function Guard({ role }: { role: Role }) {
  const { me } = useApp()
  if (!me) return <Navigate to="/login" replace />
  if (me.role !== role) return <Navigate to={`/${me.role}`} replace />
  if (me.mustChange) return <ForcePassword />
  return <AppLayout />
}
export default function App() {
  const { me } = useApp(), lang = useLang()
  return (
    <Fragment key={lang}><Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={me ? <Navigate to={`/${me.role}`} replace /> : <Login />} />
      <Route path="/register" element={me ? <Navigate to={`/${me.role}`} replace /> : <Register />} />
      <Route path="/admin" element={<Guard role="admin" />}>
        <Route index element={<A.Dashboard />} /><Route path="companies" element={<A.Companies />} /><Route path="users" element={<A.Employees />} />
        <Route path="trainings" element={<A.Trainings />} /><Route path="reports" element={<A.Reports />} /><Route path="subscriptions" element={<A.Subscriptions />} /><Route path="settings" element={<A.SettingsPage />} />
      </Route>
      <Route path="/organization" element={<Guard role="organization" />}>
        <Route index element={<C.Dashboard />} /><Route path="users" element={<C.Employees />} /><Route path="codes" element={<C.Codes />} />
        <Route path="trainings" element={<C.Trainings />} /><Route path="trainings/new" element={<TrainingEditor />} /><Route path="trainings/:id/edit" element={<TrainingEditor />} />
        <Route path="categories" element={<C.Categories />} /><Route path="assignments" element={<C.Assignments />} /><Route path="reports" element={<C.Reports />} /><Route path="settings" element={<C.SettingsPage />} /><Route path="subscription" element={<Billing />} /><Route path="analytics" element={<Analytics />} />
      </Route>
      <Route path="/user" element={<Guard role="user" />}>
        <Route index element={<E.Dashboard />} /><Route path="trainings" element={<E.MyTrainings />} /><Route path="trainings/:id" element={<E.TrainingDetail />} />
        <Route path="learn/:id" element={<Learning />} /><Route path="history" element={<E.History />} /><Route path="profile" element={<E.Profile />} /><Route path="notifications" element={<E.Notifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></Fragment>
  )
}
export { Outlet }
