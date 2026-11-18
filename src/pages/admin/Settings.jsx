import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, Save } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PhotoManager from '../../components/ui/PhotoManager'
import { fitsInStorage } from '../../utils/image'

export default function Settings() {
  const { settings, updateSettings, resetData } = useData()
  const { logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [business, setBusiness] = useState({
    businessName: settings.businessName,
    tagline: settings.tagline,
    phone: settings.phone,
    phoneHref: settings.phoneHref,
    email: settings.email,
    address: settings.address,
    hours: settings.hours,
    heroImage: settings.heroImage,
    aboutImage: settings.aboutImage,
  })
  const [contactEmailEnabled, setContactEmailEnabled] = useState(settings.contactEmailEnabled !== false)
  const [pricing, setPricing] = useState({
    dailyRate: settings.dailyRate,
    deposit: settings.deposit,
    minAge: settings.minAge,
  })
  const [account, setAccount] = useState({ username: settings.adminUsername, current: '', next: '', confirm: '' })
  const [accountError, setAccountError] = useState('')
  const [resetting, setResetting] = useState(false)

  const setB = (key) => (e) => setBusiness((f) => ({ ...f, [key]: e.target.value }))
  const setP = (key) => (e) => setPricing((f) => ({ ...f, [key]: e.target.value }))
  const setA = (key) => (e) => setAccount((f) => ({ ...f, [key]: e.target.value }))

  const saveBusiness = (e) => {
    e.preventDefault()
    updateSettings(business)
    toast('Business details saved', 'success')
  }

  const savePricing = (e) => {
    e.preventDefault()
    updateSettings({
      dailyRate: Number(pricing.dailyRate),
      deposit: Number(pricing.deposit),
      minAge: Number(pricing.minAge),
    })
    toast('Pricing saved', 'success')
  }

  const saveAccount = (e) => {
    e.preventDefault()
    setAccountError('')
    if (!account.username.trim()) return setAccountError('Username is required.')
    if (account.current !== settings.adminPassword) return setAccountError('Current password is incorrect.')
    if (account.next && account.next.length < 6) return setAccountError('New password must be at least 6 characters.')
    if (account.next !== account.confirm) return setAccountError('New passwords do not match.')
    updateSettings({
      adminUsername: account.username.trim(),
      adminPassword: account.next || settings.adminPassword,
    })
    setAccount((a) => ({ ...a, current: '', next: '', confirm: '' }))
    toast('Account updated', 'success')
    return undefined
  }

  const setHeroPhoto = (photos) => {
    const heroImage = photos[0] || ''
    if (!fitsInStorage(JSON.stringify(settings), JSON.stringify({ ...settings, heroImage }))) {
      toast('Not enough browser storage for this photo. Try a smaller image.', 'error')
      return
    }
    updateSettings({ heroImage })
    setBusiness((f) => ({ ...f, heroImage }))
    toast(heroImage ? 'Home page photo updated' : 'Home page photo removed', 'success')
  }

  const confirmReset = () => {
    resetData()
    logout()
    setResetting(false)
    toast('Demo data restored', 'success')
    navigate('/admin/login')
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Settings</h1>
          <p>Business details shown on the website, pricing rules and your admin account.</p>
        </div>
      </header>

      <div className="settings-grid">
        <form className="card card-pad" onSubmit={saveBusiness}>
          <h3 style={{ fontSize: 16 }}>Business details</h3>
          <div className="form-grid mt-4">
            <div className="field"><label>Business name</label><input className="input" value={business.businessName} onChange={setB('businessName')} /></div>
            <div className="field"><label>Tagline</label><input className="input" value={business.tagline} onChange={setB('tagline')} /></div>
            <div className="field"><label>Phone (display)</label><input className="input" value={business.phone} onChange={setB('phone')} /></div>
            <div className="field"><label>Phone (tel: link)</label><input className="input" value={business.phoneHref} onChange={setB('phoneHref')} /></div>
            <div className="field span-2"><label>Email</label><input className="input" type="email" value={business.email} onChange={setB('email')} /></div>
            <div className="field span-2"><label>Address</label><input className="input" value={business.address} onChange={setB('address')} /></div>
            <div className="field span-2"><label>Hours</label><input className="input" value={business.hours} onChange={setB('hours')} /></div>
          </div>
          <button type="submit" className="btn btn-gold mt-6"><Save size={16} /> Save details</button>
        </form>

        <div className="flex" style={{ flexDirection: 'column', gap: 18 }}>
          <div className="card card-pad">
            <h3 style={{ fontSize: 16 }}>Home page photo</h3>
            <p className="muted small mt-2">The large photo at the top of the home page. This is separate from vehicle photos.</p>
            <div className="mt-4">
              <PhotoManager
                photos={settings.heroImage ? [settings.heroImage] : []}
                onChange={setHeroPhoto}
                onError={(msg) => toast(msg, 'error')}
                max={1}
                hint="JPG, PNG or WEBP. Wide photos look best. Saved as soon as you upload."
              />
            </div>
          </div>

          <form className="card card-pad" onSubmit={savePricing}>
            <h3 style={{ fontSize: 16 }}>Pricing & rules</h3>
            <div className="form-grid mt-4">
              <div className="field"><label>Starting daily rate (USD)</label><input className="input" type="number" min="1" value={pricing.dailyRate} onChange={setP('dailyRate')} /></div>
              <div className="field"><label>Deposit (USD)</label><input className="input" type="number" min="0" value={pricing.deposit} onChange={setP('deposit')} /></div>
              <div className="field"><label>Minimum driver age</label><input className="input" type="number" min="18" value={pricing.minAge} onChange={setP('minAge')} /></div>
            </div>
            <button type="submit" className="btn btn-gold mt-6"><Save size={16} /> Save pricing</button>
          </form>

          <form className="card card-pad" onSubmit={(e) => { e.preventDefault(); updateSettings({ contactEmailEnabled }); toast('Email settings saved') }}>
            <h3 style={{ fontSize: 16 }}>Contact form email</h3>
            <p className="muted small mt-2">
              When on, contact-form messages are also emailed to <strong>{settings.email}</strong> via FormSubmit
              (free, no account needed). The first message triggers a one-time confirmation email to that inbox —
              click the link in it once and delivery is live. Every message still lands in the Messages page either way.
            </p>
            <label className="check-row mt-4" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={contactEmailEnabled} onChange={(e) => setContactEmailEnabled(e.target.checked)} />
              Email contact-form messages to {settings.email}
            </label>
            <button type="submit" className="btn btn-gold mt-6"><Save size={16} /> Save email settings</button>
          </form>

          <form className="card card-pad" onSubmit={saveAccount}>
            <h3 style={{ fontSize: 16 }}>Admin account</h3>
            <div className="form-grid mt-4">
              <div className="field span-2"><label>Username</label><input className="input" value={account.username} onChange={setA('username')} autoComplete="username" /></div>
              <div className="field span-2"><label>Current password</label><input className="input" type="password" value={account.current} onChange={setA('current')} autoComplete="current-password" /></div>
              <div className="field"><label>New password</label><input className="input" type="password" value={account.next} onChange={setA('next')} autoComplete="new-password" /></div>
              <div className="field"><label>Confirm new password</label><input className="input" type="password" value={account.confirm} onChange={setA('confirm')} autoComplete="new-password" /></div>
            </div>
            {accountError && <span className="form-error mt-2" style={{ display: 'block' }}>{accountError}</span>}
            <button type="submit" className="btn btn-gold mt-6"><Save size={16} /> Update account</button>
          </form>

          <div className="card card-pad danger-zone">
            <h3 style={{ fontSize: 16 }}>Reset demo data</h3>
            <p className="muted small mt-2">Restore the sample vehicles, bookings and default settings. This clears everything saved in this browser.</p>
            <button type="button" className="btn btn-danger mt-4" onClick={() => setResetting(true)}><RotateCcw size={16} /> Reset data</button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={resetting}
        title="Reset all data"
        message="This will remove every vehicle, booking and setting you have changed and restore the sample data. You will be signed out."
        confirmLabel="Reset"
        onConfirm={confirmReset}
        onClose={() => setResetting(false)}
      />
    </>
  )
}
