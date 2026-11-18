import { Link } from 'react-router-dom'
import { Clock, Mail, MapPin, Phone, LockKeyhole } from 'lucide-react'
import Logo from '../ui/Logo'
import { useData } from '../../context/DataContext'

export default function Footer() {
  const { settings } = useData()

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="muted mt-4" style={{ maxWidth: 320 }}>
            Clean, reliable vehicles with pick up and drop off service across Grand Bahama Island.
          </p>
        </div>

        <div>
          <h4 className="footer-title">Explore</h4>
          <ul className="footer-links">
            <li><Link to="/fleet">Car</Link></li>
            <li><Link to="/book">Book a Car</Link></li>
            <li><Link to="/booking-status">Check My Booking</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="footer-title">Rental Info</h4>
          <ul className="footer-links">
            <li>From ${settings.dailyRate} a day</li>
            <li>${settings.deposit} refundable deposit</li>
            <li>Drivers {settings.minAge} and older</li>
            <li>Airport & cruise port delivery</li>
          </ul>
        </div>

        <div>
          <h4 className="footer-title">Contact</h4>
          <ul className="footer-links footer-contact">
            <li><Phone size={16} /><a href={settings.phoneHref}>{settings.phone}</a></li>
            <li><Phone size={16} /><a href={settings.secondaryPhoneHref}>{settings.secondaryPhone}</a></li>
            <li><Mail size={16} /><a href={`mailto:${settings.email}`}>{settings.email}</a></li>
            <li><MapPin size={16} /><span>{settings.address}</span></li>
            <li><Clock size={16} /><span>{settings.hours}</span></li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>&copy; {new Date().getFullYear()} {settings.businessName}. All rights reserved.</span>
        <Link to="/admin/login" className="footer-admin">
          <LockKeyhole size={14} />
          Admin
        </Link>
      </div>
    </footer>
  )
}
