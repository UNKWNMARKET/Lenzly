import { Route, Switch, useLocation } from 'wouter'
import { Toaster } from 'sonner'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Explore from './pages/Explore'
import FindPhotographer from './pages/FindPhotographer'
import Profile from './pages/Profile'
import BrandsPage from './pages/BrandsPage'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import NotFound from './pages/NotFound'
import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import UploadPost from './pages/UploadPost'
import EditProfile from './pages/EditProfile'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSpots from './pages/admin/AdminSpots'
import AdminPhotographers from './pages/admin/AdminPhotographers'
import AdminPosts from './pages/admin/AdminPosts'
import AdminBrands from './pages/admin/AdminBrands'
import AdminSettings from './pages/admin/AdminSettings'
import { useAdminAuth } from './contexts/AdminAuthContext'

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { admin } = useAdminAuth()
  if (!admin) return <AdminLogin />
  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  )
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth()
  const [, navigate] = useLocation()
  if (loading) return (
    <div className="min-h-screen bg-lenz-bg flex items-center justify-center">
      <img src="/logo.png" alt="LENZLY" className="h-12 w-auto animate-pulse"
        onError={e => {
          e.currentTarget.style.display = 'none'
          const span = document.createElement('span')
          span.className = 'text-[#C9A84C] font-bold tracking-widest text-sm animate-pulse'
          span.textContent = 'LENZLY'
          e.currentTarget.parentNode?.appendChild(span)
        }}
      />
    </div>
  )
  if (!user) {
    navigate('/auth/login')
    return null
  }
  return <Component />
}

function Router() {
  return (
    <Switch>
      {/* Auth */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/signup" component={SignUp} />

      {/* Protected app */}
      <Route path="/">{() => <ProtectedRoute component={Home} />}</Route>
      <Route path="/explore">{() => <ProtectedRoute component={Explore} />}</Route>
      <Route path="/find">{() => <ProtectedRoute component={FindPhotographer} />}</Route>
      <Route path="/profile">{() => <ProtectedRoute component={Profile} />}</Route>
      <Route path="/upload">{() => <ProtectedRoute component={UploadPost} />}</Route>
      <Route path="/profile/edit">{() => <ProtectedRoute component={EditProfile} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
      <Route path="/notifications">{() => <ProtectedRoute component={Notifications} />}</Route>
      <Route path="/messages">{() => <ProtectedRoute component={Messages} />}</Route>
      <Route path="/chat/:id">{() => <ProtectedRoute component={Chat} />}</Route>
      <Route path="/brands" component={BrandsPage} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />

      {/* Admin */}
      <Route path="/admin">{() => <AdminRoute component={AdminDashboard} />}</Route>
      <Route path="/admin/spots">{() => <AdminRoute component={AdminSpots} />}</Route>
      <Route path="/admin/photographers">{() => <AdminRoute component={AdminPhotographers} />}</Route>
      <Route path="/admin/posts">{() => <AdminRoute component={AdminPosts} />}</Route>
      <Route path="/admin/brands">{() => <AdminRoute component={AdminBrands} />}</Route>
      <Route path="/admin/settings">{() => <AdminRoute component={AdminSettings} />}</Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <AdminAuthProvider>
            <div className="relative">
              <Router />
              <BottomNavWrapper />
            </div>
            <Toaster
              theme="dark"
              position="top-center"
              toastOptions={{
                style: {
                  background: '#111111',
                  border: '1px solid #1e1e1e',
                  color: '#f5f5f5',
                  fontFamily: 'Inter, sans-serif',
                },
              }}
            />
          </AdminAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

function BottomNavWrapper() {
  const [location] = useLocation()
  const { user } = useAuth()
  const authRoutes = ['/auth/login', '/auth/signup']
  if (!user || authRoutes.includes(location) || location === '/brands' || location.startsWith('/admin') || location === '/privacy' || location === '/terms' || location === '/upload' || location === '/profile/edit' || location === '/settings' || location === '/notifications' || location === '/messages' || location.startsWith('/chat/')) {
    return null
  }
  return <BottomNav />
}
