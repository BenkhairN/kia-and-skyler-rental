import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { Menu, Phone, X } from 'lucide-react'
import Logo from '../ui/Logo'
import ThemeToggle from '../ui/ThemeToggle'
import { useData } from '../../context/DataContext'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/fleet', label: 'Car' },
  { to: '/booking-status', label: 'My Booking' },
  { to: '/faq', label: 'FAQ' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { settings } = useData()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navRef = useRef(null)
  const { pathname } = useLocation()
  const [pill, setPill] = useState({ left: 0, top: 0, width: 0, height: 0, visible: false })

  useEffect(() => {
    const update = () => {
      const nav = navRef.current
      const active = nav && nav.querySelector('.nav-link.active')
      if (active) {
        setPill({
          left: active.offsetLeft,
          top: active.offsetTop,
          width: active.offsetWidth,
          height: active.offsetHeight,
          visible: true,
        })
      } else {
        setPill((p) => ({ ...p, visible: false }))
      }
    }
    update()
    const t = setTimeout(update, 60)
    window.addEventListener('resize', update)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', update)
    }
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Logo />

        <nav className={`nav-links ${open ? 'open' : ''}`} ref={navRef}>
          <span
            className="nav-pill"
            aria-hidden="true"
            style={{
              transform: `translate(${pill.left}px, ${pill.top}px)`,
              width: pill.width,
              height: pill.height,
              opacity: pill.visible && !open ? 1 : 0,
            }}
          />
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          <Link to="/book" className="btn btn-gold nav-cta-mobile" onClick={() => setOpen(false)}>
            Book Now
          </Link>
        </nav>

        <div className="nav-actions">
          <ThemeToggle />
          <a href={settings.phoneHref} className="nav-phone">
            <Phone size={16} />
            <span>{settings.phone}</span>
          </a>
          <Link to="/book" className="btn btn-gold btn-sm nav-cta">
            Book Now
          </Link>
          <button
            type="button"
            className="btn-icon nav-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}
