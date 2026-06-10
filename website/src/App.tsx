import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Marketing
import Home from './pages/Home'
import Feed from './pages/Feed'
import Brands from './pages/Brands'
import PhotographerProfile from './pages/PhotographerProfile'
import PostDetail from './pages/PostDetail'

// Auth
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'

// App (authenticated)
import AppLayout from './components/app/AppLayout'
import AppFeed from './pages/app/Feed'
import Explore from './pages/app/Explore'
import SearchPage from './pages/app/SearchPage'
import Profile from './pages/app/Profile'
import PostView from './pages/app/PostView'
import Messages from './pages/app/Messages'
import Chat from './pages/app/Chat'
import Notifications from './pages/app/Notifications'
import UploadPage from './pages/app/Upload'
import Settings from './pages/app/Settings'
import EditProfile from './pages/app/EditProfile'

// Admin
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'

// Business
import BusinessLayout from './components/app/BusinessLayout'
import BusinessLogin from './pages/business/BusinessLogin'
import BusinessOnboarding from './pages/business/BusinessOnboarding'
import BusinessDashboard from './pages/business/BusinessDashboard'
import BusinessDiscover from './pages/business/BusinessDiscover'
import BusinessPhotographer from './pages/business/BusinessPhotographer'
import BusinessShortlist from './pages/business/BusinessShortlist'
import BusinessRequests from './pages/business/BusinessRequests'

function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (<><Navbar /><main>{children}</main><Footer /></>)
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Marketing */}
          <Route path="/" element={<MarketingLayout><Home /></MarketingLayout>} />
          <Route path="/feed" element={<MarketingLayout><Feed /></MarketingLayout>} />
          <Route path="/brands" element={<MarketingLayout><Brands /></MarketingLayout>} />
          <Route path="/photographer/:id" element={<MarketingLayout><PhotographerProfile /></MarketingLayout>} />
          <Route path="/post/:id" element={<MarketingLayout><PostDetail /></MarketingLayout>} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Authenticated app */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<AppFeed />} />
            <Route path="explore" element={<Explore />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:id" element={<Chat />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="edit-profile" element={<EditProfile />} />
            <Route path="post/:id" element={<PostView />} />
            <Route path="u/:username" element={<Profile />} />
          </Route>

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Business */}
          <Route path="/business/login" element={<BusinessLogin />} />
          <Route path="/business/onboarding" element={<BusinessOnboarding />} />
          <Route path="/business" element={<BusinessLayout />}>
            <Route index element={<BusinessDashboard />} />
            <Route path="discover" element={<BusinessDiscover />} />
            <Route path="shortlist" element={<BusinessShortlist />} />
            <Route path="requests" element={<BusinessRequests />} />
            <Route path="photographer/:id" element={<BusinessPhotographer />} />
          </Route>

          <Route path="*" element={<MarketingLayout><div className="min-h-screen pt-24 text-center text-white/30 py-20">Page not found</div></MarketingLayout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
