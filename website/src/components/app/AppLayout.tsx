import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function AppLayout() {
  const { user, loading, isBusiness, isAdmin } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-lenz-bg">
      <div className="w-8 h-8 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  // Business/brand accounts are confined to the brand area. Admin keeps both.
  if (isBusiness && !isAdmin) return <Navigate to="/business" replace />

  return (
    <div className="min-h-screen bg-lenz-bg">
      <Sidebar />
      <main className="md:pl-64 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
