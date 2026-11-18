import { NavLink, Link, useNavigate } from 'react-router-dom'
import { CalendarCheck, CalendarDays, CarFront, ExternalLink, Inbox, LayoutDashboard, LogOut, Settings, Users, X } from 'lucide-react'
import Logo from '../ui/Logo'
import ThemeToggle from '../ui/ThemeToggle'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { initials } from '../../utils/format'

const items = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/cars', label: 'Vehicles', icon: CarFront },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/admin/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/feedback', label: 'Feedback', icon: Inbox },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const { bookings, messages } = useData()
  const navigate = useNavigate()
  const pending = bookings.filter((b) => b.status === 'pending').length
  const unread = (messages || []).filter((m) => !m.read).length

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-head">
          <Logo to="/admin" compact />
          <button type="button" className="btn-icon sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section">Manage</span>
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Bookings' && pending > 0 && <span className="sidebar-count">{pending}</span>}
              {label === 'Feedback' && unread > 0 && <span className="sidebar-count">{unread}</span>}
            </NavLink>
          ))}

          <span className="sidebar-section">Shortcuts</span>
          <Link to="/" className="sidebar-link" target="_blank" rel="noreferrer">
            <ExternalLink size={18} />
            <span>View website</span>
          </Link>
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-user">
            <div className="avatar">{initials(user?.username || 'A')}</div>
            <div>
              <strong>{user?.username}</strong>
              <span>Administrator</span>
            </div>
          </div>
          <div className="sidebar-foot-actions">
            <ThemeToggle />
            <button type="button" className="btn-icon" onClick={handleLogout} title="Sign out" aria-label="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
