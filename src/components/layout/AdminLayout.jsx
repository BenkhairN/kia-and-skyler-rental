import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import '../../styles/admin.css'

const titles = {
  '/admin': 'Dashboard',
  '/admin/cars': 'Vehicles',
  '/admin/bookings': 'Bookings',
  '/admin/calendar': 'Calendar',
  '/admin/customers': 'Customers',
  '/admin/feedback': 'Feedback',
  '/admin/settings': 'Settings',
}

export default function AdminLayout() {
  const { isAuthenticated } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const onNew = (e) => {
      e.detail.forEach((b) => toast(`New booking request ${b.id} from ${b.customerName || 'a customer'}`, 'info'))
    }
    window.addEventListener('ksr:new-bookings', onNew)

    const onNewMessage = (e) => {
      e.detail.forEach((m) => toast(`New feedback from ${m.name || 'a visitor'}`))
    }
    window.addEventListener('ksr:new-messages', onNewMessage)
    return () => {
      window.removeEventListener('ksr:new-bookings', onNew)
      window.removeEventListener('ksr:new-messages', onNewMessage)
    }
  }, [toast])

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: pathname }} />
  }

  return (
    <div className="admin-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="admin-content">
        <div className="admin-topbar">
          <button type="button" className="btn-icon admin-menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <span className="admin-topbar-title">{titles[pathname] || 'Admin'}</span>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
