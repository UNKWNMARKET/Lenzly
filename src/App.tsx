import { Route, Switch, useLocation } from 'wouter'
import { useEffect } from 'react'
import { App as CapApp } from '@capacitor/app'
import { supabase } from '@/lib/supabase'
import { Toaster } from 'sonner'
import ErrorBoundary from './components/ErrorBoundary'
import PageErrorBoundary from './components/PageErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
import { ThemeProvider } from './contexts/ThemeContext'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProProvider } from './contexts/ProContext'
import { SpotModalProvider, useSpotModal } from './contexts/SpotModalContext'
import SpotDetailModal from './components/SpotDetailModal'
import { useSwipeNav } from './hooks/useSwipeNav'
import BottomNav from './components/BottomNav'
import SideNav from './components/SideNav'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Search from './pages/Search'
import Explore from './pages/Explore'
import FindPhotographer from './pages/FindPhotographer'
import Profile from './pages/Profile'
import BrandsPage from './pages/BrandsPage'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import NotFound from './pages/NotFound'
import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import PostSpot from './pages/PostSpot'
import UploadPost from './pages/UploadPost'
import EditProfile from './pages/EditProfile'
import Settings from './pages/Settings'
import GoPro from './pages/GoPro'
import ProCheckout from './pages/ProCheckout'
import Notifications from './pages/Notifications'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import PhotographerProfile from './pages/PhotographerProfile'
import PostDetail from './pages/PostDetail'
import Weddings from './pages/Weddings'
import StoryArchive from './pages/StoryArchive'
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

function ProtectedRoute({ component: Component, skipOnboarding }: { component: React.ComponentType; skipOnboarding?: boolean }) {
  const { user, profile, loading } = useAuth()
  const [location, navigate] = useLocation()
  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold tracking-[0.2em] gold-text">LENZLY</h1>
      <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase">Photography Platform</p>
      <div className="mt-6 w-6 h-6 rounded-full border-2 border-gold/25 border-t-gold animate-spin" />
    </div>
  )
  if (!user) {
    navigate('/auth/login')
    return null
  }
  // New users who haven't set their display name yet → profile setup first.
  if (!skipOnboarding && profile && !profile.name && location !== '/profile/edit') {
    navigate('/profile/edit')
    return null
  }
  // Then send through onboarding (follow suggestions etc.).
  if (!skipOnboarding && profile && profile.name && profile.onboarded === false && location !== '/onboarding') {
    navigate('/onboarding')
    return null
  }
  return <PageErrorBoundary><Component /></PageErrorBoundary>
}

function Router() {
  return (
    <Switch>
      {/* Auth */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/signup" component={SignUp} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />
      <Route path="/auth/reset-password" component={ResetPassword} />

      {/* Onboarding (protected, but exempt from the onboarding redirect) */}
      <Route path="/onboarding">{() => <ProtectedRoute component={Onboarding} skipOnboarding />}</Route>

      {/* Protected app */}
      <Route path="/">{() => <ProtectedRoute component={Home} />}</Route>
      <Route path="/spot">{() => <ProtectedRoute component={PostSpot} />}</Route>
      <Route path="/explore">{() => <ProtectedRoute component={Explore} />}</Route>
      <Route path="/search">{() => <ProtectedRoute component={Search} />}</Route>
      <Route path="/find">{() => <ProtectedRoute component={FindPhotographer} />}</Route>
      <Route path="/profile">{() => <ProtectedRoute component={Profile} />}</Route>
      <Route path="/upload">{() => <ProtectedRoute component={UploadPost} />}</Route>
      <Route path="/profile/edit">{() => <ProtectedRoute component={EditProfile} skipOnboarding />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
      <Route path="/pro">{() => <ProtectedRoute component={GoPro} />}</Route>
      <Route path="/pro/checkout">{() => <ProtectedRoute component={ProCheckout} />}</Route>
      <Route path="/notifications">{() => <ProtectedRoute component={Notifications} />}</Route>
      <Route path="/messages">{() => <ProtectedRoute component={Messages} />}</Route>
      <Route path="/chat/:id">{() => <ProtectedRoute component={Chat} />}</Route>
      <Route path="/photographer/:id">{() => <ProtectedRoute component={PhotographerProfile} />}</Route>
      <Route path="/post/:id">{() => <ProtectedRoute component={PostDetail} />}</Route>
      <Route path="/weddings">{() => <ProtectedRoute component={Weddings} />}</Route>
      <Route path="/story-archive">{() => <ProtectedRoute component={StoryArchive} />}</Route>
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
          <ProProvider>
          <AdminAuthProvider>
          <SpotModalProvider>
            <SwipeWrapper>
              <OfflineBanner />
              <DeepLinkHandler />
              <Router />
              <BottomNavWrapper />
            </SwipeWrapper>
            <GlobalSpotModal />
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
          </SpotModalProvider>
          </AdminAuthProvider>
          </ProProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

function DeepLinkHandler() {
  const [, navigate] = useLocation()
  useEffect(() => {
    const handler = CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url.startsWith('lenzly://')) return
      // Parse tokens from the URL hash: lenzly://auth/reset-password#access_token=...&type=recovery
      const hash = url.split('#')[1] ?? ''
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')
      if (type === 'recovery' && accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        navigate('/auth/reset-password')
      }
    })
    return () => { handler.then(h => h.remove()) }
  }, [])
  return null
}

function SwipeWrapper({ children }: { children: React.ReactNode }) {
  const { onTouchStart, onTouchEnd } = useSwipeNav()
  return (
    <div className="absolute inset-0" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {children}
    </div>
  )
}

function GlobalSpotModal() {
  const { currentSpot, closeSpot } = useSpotModal()
  if (!currentSpot) return null
  return <SpotDetailModal spot={currentSpot} onClose={closeSpot} />
}

function BottomNavWrapper() {
  const [location] = useLocation()
  const { user } = useAuth()
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/spot']
  const hideNav = !user || authRoutes.includes(location) || location === '/onboarding' || location === '/search' || location === '/brands' || location.startsWith('/admin') || location === '/privacy' || location === '/terms' || location === '/upload' || location === '/profile/edit' || location === '/settings' || location === '/pro' || location === '/pro/checkout' || location === '/notifications' || location === '/messages' || location.startsWith('/chat/') || location.startsWith('/photographer/') || location.startsWith('/post/') || location === '/story-archive'
  if (hideNav) return null
  return (
    <>
      <BottomNav />
      <SideNav />
    </>
  )
}
