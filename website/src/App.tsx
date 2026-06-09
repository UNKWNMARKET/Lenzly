import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Feed from './pages/Feed'
import PhotographerProfile from './pages/PhotographerProfile'
import PostDetail from './pages/PostDetail'
import Brands from './pages/Brands'

function Layout({ children }: { children: React.ReactNode }) {
  return (<><Navbar /><main>{children}</main><Footer /></>)
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/feed" element={<Layout><Feed /></Layout>} />
        <Route path="/photographer/:id" element={<Layout><PhotographerProfile /></Layout>} />
        <Route path="/post/:id" element={<Layout><PostDetail /></Layout>} />
        <Route path="/brands" element={<Layout><Brands /></Layout>} />
        <Route path="*" element={<Layout><div className="min-h-screen pt-24 text-center text-white/30 py-20">Page not found</div></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}
