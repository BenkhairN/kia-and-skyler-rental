import { Link } from 'react-router-dom'

export default function Logo({ to = '/', compact = false }) {
  return (
    <Link to={to} className={`logo ${compact ? 'logo-compact' : ''}`}>
      <img src="/images/logo-mark.webp" alt="Kia & Skyler Rentals" className="logo-img" />
    </Link>
  )
}
