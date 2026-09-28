import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthLayout } from './components/layout/AuthLayout'
import { CitizenLayout } from './components/layout/CitizenLayout'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { PublicLayout } from './components/layout/PublicLayout'
import AdminDashboard from './pages/admin/Dashboard'
import ComplaintsMapPage from './pages/admin/ComplaintsMap'
import { CategoriesPage, DepartmentsPage, DistrictsPage, EmployeesPage, KeywordsPage, UsersPage } from './pages/admin/Management'
import Recurring from './pages/admin/Recurring'
import Reports from './pages/admin/Reports'
import Satisfaction from './pages/admin/Satisfaction'
import Settings from './pages/admin/Settings'
import Weather from './pages/admin/Weather'
import ForgotPassword from './pages/auth/ForgotPassword'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ResetPassword from './pages/auth/ResetPassword'
import CitizenComplaintDetails from './pages/citizen/ComplaintDetails'
import CitizenDashboard from './pages/citizen/Dashboard'
import MyComplaints from './pages/citizen/MyComplaints'
import NewComplaint from './pages/citizen/NewComplaint'
import Notifications from './pages/citizen/Notifications'
import Profile from './pages/citizen/Profile'
import RateService from './pages/citizen/RateService'
import StaffComplaintDetails from './pages/employee/ComplaintDetails'
import ComplaintsPage from './pages/employee/Complaints'
import EmployeeDashboard from './pages/employee/Dashboard'
import DesignSystem from './pages/public/DesignSystem'
import Home from './pages/public/Home'
import NotFound from './pages/public/NotFound'
import Screens from './pages/public/Screens'
import Track from './pages/public/Track'

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        {/* عام */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="track" element={<Track />} />
          <Route path="screens" element={<Screens />} />
          <Route path="design-system" element={<DesignSystem />} />
        </Route>

        {/* المصادقة */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        {/* المواطن */}
        <Route path="citizen" element={<CitizenLayout />}>
          <Route index element={<CitizenDashboard />} />
          <Route path="complaints" element={<MyComplaints />} />
          <Route path="complaints/:id" element={<CitizenComplaintDetails />} />
          <Route path="complaints/:id/rate" element={<RateService />} />
          <Route path="new" element={<NewComplaint />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* الموظف */}
        <Route path="employee" element={<DashboardLayout role="employee" />}>
          <Route index element={<EmployeeDashboard />} />
          <Route path="complaints" element={<ComplaintsPage base="employee" />} />
          <Route path="complaints/:id" element={<StaffComplaintDetails base="employee" />} />
          <Route path="map" element={<ComplaintsMapPage base="employee" />} />
        </Route>

        {/* المدير */}
        <Route path="admin" element={<DashboardLayout role="admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="complaints" element={<ComplaintsPage base="admin" />} />
          <Route path="complaints/:id" element={<StaffComplaintDetails base="admin" />} />
          <Route path="map" element={<ComplaintsMapPage base="admin" />} />
          <Route path="recurring" element={<Recurring />} />
          <Route path="weather" element={<Weather />} />
          <Route path="reports" element={<Reports />} />
          <Route path="satisfaction" element={<Satisfaction />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="districts" element={<DistrictsPage />} />
          <Route path="keywords" element={<KeywordsPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
