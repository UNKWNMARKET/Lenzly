import { Route, Switch, useLocation } from 'wouter'
import { Toaster } from 'sonner'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Explore from './pages/Explore'
import FindPhotographer from './pages/FindPhotographer'
import Profile from './pages/Profile'
import BrandsPage from './pages/BrandsPage'
import NotFound from './pages/NotFound'

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/explore" component={Explore} />
      <Route path="/find" component={FindPhotographer} />
      <Route path="/profile" component={Profile} />
      <Route path="/brands" component={BrandsPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <div className="relative">
          <Router />
          {/* Hide bottom nav on brands page */}
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
      </ThemeProvider>
    </ErrorBoundary>
  )
}

function BottomNavWrapper() {
  const [location] = useLocation()
  if (location === '/brands') return null
  return <BottomNav />
}
