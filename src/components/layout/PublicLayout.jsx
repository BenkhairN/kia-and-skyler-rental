import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import FeedbackWidget from '../ui/FeedbackWidget'
import '../../styles/public.css'

export default function PublicLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="public-shell">
      <Navbar />
      <main className="public-main">
        <Outlet />
      </main>
      <Footer />
      <FeedbackWidget />
    </div>
  )
}
