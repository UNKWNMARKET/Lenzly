import { Route, Switch, useLocation } from 'wouter'
import { Toaster } from 'sonner'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Explore from './pages/Explore'
import FindPhotographer from './pages/FindPhotographer'
import Profile from './pages/Profile'
import BrandsPage from './pages/BrandsPage'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import NotFound from './pages/NotFound'
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

function Router() {
  return (
    <Switch>
      {/* Public app */}
      <Route path="/" component={Home} />
      <Route path="/explore" component={Explore} />
      <Route path="/find" component={FindPhotographer} />
      <Route path="/profile" component={Profile} />
      <Route path="/brands" component={BrandsPage} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />

      {/* Admin */}
      <Route path="/admin">
        {() => <AdminRoute component={AdminDashboard} />}
      </Route>
      <Route path="/admin/spots">
        {() => <AdminRoute component={AdminSpots} />}
      </Route>
      <Route path="/admin/photographers">
        {() => <AdminRoute component={AdminPhotographers} />}
      </Route>
      <Route path="/admin/posts">
        {() => <AdminRoute component={AdminPosts} />}
      </Route>
      <Route path="/admin/brands">
        {() => <AdminRoute component={AdminBrands} />}
      </Route>
      <Route path="/admin/settings">
        {() => <AdminRoute component={AdminSettings} />}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
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
      </ThemeProvider>
    </ErrorBoundary>
  )
}

function BottomNavWrapper() {
  const [location] = useLocation()
  if (location === '/brands' || location.startsWith('/admin') || location === '/privacy' || location === '/terms') {
    return null
  }
  return <BottomNav />
}
