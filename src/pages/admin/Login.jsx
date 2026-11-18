import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarCheck, CarFront, Eye, EyeOff, LockKeyhole, UserRound, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Logo from '../../components/ui/Logo'
import ThemeToggle from '../../components/ui/ThemeToggle'
import '../../styles/admin.css'

export default function Login() {
  const { isAuthenticated, login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) return <Navigate to="/admin" replace />

  const submit = (e) => {
    e.preventDefault()
    if (login(username, password)) {
      toast('Welcome back', 'success')
      navigate(location.state?.from || '/admin', { replace: true })
    } else {
      setError('Incorrect username or password.')
    }
  }

  return (
    <div className="login-page">
      <aside className="login-side">
        <Logo />
        <div>
          <span className="script gold-text">Admin</span>
          <h2>Manage your fleet, bookings and customers in one place.</h2>
          <p>Track availability, confirm reservations and keep your business details up to date.</p>
          <ul className="login-points">
            <li><CarFront size={18} /> Add, edit and retire vehicles</li>
            <li><CalendarCheck size={18} /> Approve and track every booking</li>
            <li><Users size={18} /> See repeat customers at a glance</li>
          </ul>
        </div>
        <span className="muted small">Serving Grand Bahama Island</span>
      </aside>

      <div className="login-form-wrap">
        <ThemeToggle className="login-theme-toggle" />
        <div className="login-card card">
          <Link to="/" className="login-back">
            <ArrowLeft size={14} />
            Back to website
          </Link>
          <h1>Sign in</h1>
          <p>Enter your administrator credentials to continue.</p>

          <form className="login-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="username">Username</label>
              <div className="input-icon">
                <UserRound size={16} />
                <input
                  id="username"
                  className="input"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-icon password-field">
                <LockKeyhole size={16} />
                <input
                  id="password"
                  className="input"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
                <button type="button" className="btn-icon" onClick={() => setShow((v) => !v)} aria-label="Toggle password">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <span className="form-error">{error}</span>}
            <button type="submit" className="btn btn-gold btn-lg">Sign in</button>
          </form>

          <div className="login-hint">
            Default credentials: <code>admin</code> / <code>admin123</code>. Change them under Settings after signing in.
          </div>
        </div>
      </div>
    </div>
  )
}
