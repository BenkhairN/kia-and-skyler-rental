import { useState } from 'react'
import { Save } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { uploadPhoto } from '../../lib/db'
import PhotoManager from '../../components/ui/PhotoManager'

export default function Settings() {
  const { settings, updateSettings } = useData()
  const { user } = useAuth()
  const { toast } = useToast()

  const [business, setBusiness] = useState({
    businessName: settings.businessName,
    tagline: settings.tagline,
    phone: settings.phone,
    phoneHref: settings.phoneHref,
    secondaryPhone: settings.secondaryPhone,
    secondaryPhoneHref: settings.secondaryPhoneHref,
    email: settings.email,
    address: settings.address,
    hours: settings.hours,
    bankName: settings.bankName,
    bankAccountName: settings.bankAccountName,
    bankAccountType: settings.bankAccountType,
    bankAccountNumber: settings.bankAccountNumber,
    bankCurrency: settings.bankCurrency,
    heroImage: settings.heroImage,
    aboutImage: settings.aboutImage,
  })
  const [pricing, setPricing] = useState({
    dailyRate: settings.dailyRate,
    deposit: settings.deposit,
    minAge: settings.minAge,
  })
  const [account, setAccount] = useState({ next: '', confirm: '' })
  const [accountError, setAccountError] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)

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

  const saveAccount = async (e) => {
    e.preventDefault()
    setAccountError('')
    if (account.next.length < 6) return setAccountError('New password must be at least 6 characters.')
    if (account.next !== account.confirm) return setAccountError('New passwords do not match.')
    setSavingAccount(true)
    const { error } = await supabase.auth.updateUser({ password: account.next })
    setSavingAccount(false)
    if (error) return setAccountError(error.message)
    setAccount({ next: '', confirm: '' })
    toast('Password updated', 'success')
    return undefined
  }

  const setHeroPhoto = async (photos) => {
    const src = photos[0] || ''
    try {
      const heroImage = src.startsWith('data:') ? await uploadPhoto(src, 'site') : src
      updateSettings({ heroImage })
      setBusiness((f) => ({ ...f, heroImage }))
      toast(heroImage ? 'Home page photo updated' : 'Home page photo removed', 'success')
    } catch (err) {
      toast(`Could not upload the photo: ${err.message}`, 'error')
    }
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
            <div className="field"><label>Secondary phone (display)</label><input className="input" value={business.secondaryPhone || ''} onChange={setB('secondaryPhone')} /></div>
            <div className="field"><label>Secondary phone (tel: link)</label><input className="input" value={business.secondaryPhoneHref || ''} onChange={setB('secondaryPhoneHref')} /></div>
            <div className="field span-2"><label>Email</label><input className="input" type="email" value={business.email} onChange={setB('email')} /></div>
            <div className="field span-2"><label>Address</label><input className="input" value={business.address} onChange={setB('address')} /></div>
            <div className="field span-2"><label>Hours</label><input className="input" value={business.hours} onChange={setB('hours')} /></div>
            <div className="field"><label>Bank name</label><input className="input" value={business.bankName || ''} onChange={setB('bankName')} /></div>
            <div className="field"><label>Account name</label><input className="input" value={business.bankAccountName || ''} onChange={setB('bankAccountName')} /></div>
            <div className="field"><label>Account type</label><input className="input" value={business.bankAccountType || ''} onChange={setB('bankAccountType')} /></div>
            <div className="field"><label>Account number</label><input className="input" value={business.bankAccountNumber || ''} onChange={setB('bankAccountNumber')} /></div>
            <div className="field"><label>Account currency</label><input className="input" value={business.bankCurrency || ''} onChange={setB('bankCurrency')} /></div>
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

          <form className="card card-pad" onSubmit={saveAccount}>
            <h3 style={{ fontSize: 16 }}>Admin account</h3>
            <p className="muted small mt-2">Signed in as <strong>{user?.email}</strong></p>
            <div className="form-grid mt-4">
              <div className="field"><label>New password</label><input className="input" type="password" value={account.next} onChange={setA('next')} autoComplete="new-password" /></div>
              <div className="field"><label>Confirm new password</label><input className="input" type="password" value={account.confirm} onChange={setA('confirm')} autoComplete="new-password" /></div>
            </div>
            {accountError && <span className="form-error mt-2" style={{ display: 'block' }}>{accountError}</span>}
            <button type="submit" className="btn btn-gold mt-6" disabled={savingAccount}><Save size={16} /> {savingAccount ? 'Updating...' : 'Update password'}</button>
          </form>
        </div>
      </div>
    </>
  )
}
