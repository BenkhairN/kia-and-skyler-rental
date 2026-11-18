import { useMemo, useState } from 'react'
import { CarFront, Images, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { carCategories, carStatuses } from '../../data/cars'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import CarImage from '../../components/ui/CarImage'
import EmptyState from '../../components/ui/EmptyState'
import PhotoManager from '../../components/ui/PhotoManager'
import { fitsInStorage } from '../../utils/image'
import { carDisplayStatus, formatCurrency } from '../../utils/format'

const emptyCar = {
  name: '',
  year: new Date().getFullYear(),
  category: 'Sedan',
  color: '',
  plate: '',
  seats: 5,
  transmission: 'Automatic',
  fuel: 'Gasoline',
  dailyRate: 70,
  status: 'available',
  image: '',
  gallery: [],
  description: '',
  features: [],
}

export default function Cars() {
  const { cars, bookings, addCar, updateCar, deleteCar } = useData()
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [form, setForm] = useState(emptyCar)
  const [featuresText, setFeaturesText] = useState('')
  const [photos, setPhotos] = useState([])
  const [errors, setErrors] = useState({})

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cars.filter((c) => {
      const matchQ = !q || `${c.name} ${c.year} ${c.plate} ${c.color}`.toLowerCase().includes(q)
      const matchS = status === 'all' || carDisplayStatus(c, bookings) === status
      return matchQ && matchS
    })
  }, [cars, bookings, query, status])

  const openCreate = () => {
    setForm(emptyCar)
    setFeaturesText('')
    setPhotos([])
    setErrors({})
    setEditing('new')
  }

  const openEdit = (car) => {
    setForm({ ...emptyCar, ...car })
    setFeaturesText((car.features || []).join(', '))
    setPhotos([car.image, ...(car.gallery || [])].filter(Boolean))
    setErrors({})
    setEditing(car.id)
  }

  const close = () => setEditing(null)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const save = (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Model name is required.'
    if (!form.plate.trim()) next.plate = 'License plate is required.'
    if (Number(form.dailyRate) <= 0) next.dailyRate = 'Enter a daily rate.'
    setErrors(next)
    if (Object.keys(next).length) return

    const payload = {
      ...form,
      year: Number(form.year),
      seats: Number(form.seats),
      dailyRate: Number(form.dailyRate),
      features: featuresText.split(',').map((s) => s.trim()).filter(Boolean),
      image: photos[0] || '',
      gallery: photos.slice(1),
    }

    const nextCars = editing === 'new' ? [payload, ...cars] : cars.map((c) => (c.id === editing ? { ...c, ...payload } : c))
    if (!fitsInStorage(JSON.stringify(cars), JSON.stringify(nextCars))) {
      toast('Not enough browser storage for these photos. Remove a few photos or use smaller images.', 'error')
      return
    }

    if (editing === 'new') {
      addCar(payload)
      toast('Vehicle added', 'success')
    } else {
      updateCar(editing, payload)
      toast('Vehicle updated', 'success')
    }
    close()
  }

  const confirmDelete = () => {
    deleteCar(deleting.id)
    toast('Vehicle removed', 'success')
    setDeleting(null)
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Vehicles</h1>
          <p>{cars.length} vehicles in your fleet.</p>
        </div>
        <button type="button" className="btn btn-gold" onClick={openCreate}>
          <Plus size={16} />
          Add vehicle
        </button>
      </header>

      <section className="card">
        <div className="toolbar">
          <div className="input-icon">
            <Search size={16} />
            <input className="input" placeholder="Search model, plate or color" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {carStatuses.map((s) => (
              <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <span className="toolbar-right">{filtered.length} shown</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={CarFront}
            title="No vehicles found"
            text="Adjust your filters or add a new vehicle."
            action={<button type="button" className="btn btn-outline btn-sm" onClick={openCreate}>Add vehicle</button>}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Plate</th>
                  <th>Category</th>
                  <th>Seats</th>
                  <th>Rate</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((car) => (
                  <tr key={car.id}>
                    <td>
                      <div className="cell-car">
                        <CarImage src={car.image} alt={car.name} />
                        <div>
                          <strong>{car.name}</strong>
                          <span>
                            {car.year} &middot; {car.color}
                            {car.image && (
                              <span className="photo-count" title="Photos">
                                <Images size={12} /> {1 + (car.gallery?.length || 0)}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="td-muted">{car.plate}</td>
                    <td className="td-muted">{car.category}</td>
                    <td className="td-muted">{car.seats}</td>
                    <td className="td-strong">{formatCurrency(car.dailyRate)}<span className="td-muted">/day</span></td>
                    <td>
                      <label
                        className={`status-toggle ${car.status === 'maintenance' ? 'off' : 'on'}`}
                        title={car.status === 'maintenance' ? 'Maintenance — click to mark available' : 'Available — click to mark maintenance'}
                      >
                        <input
                          type="checkbox"
                          checked={car.status !== 'maintenance'}
                          onChange={(e) => updateCar(car.id, { status: e.target.checked ? 'available' : 'maintenance' })}
                          aria-label="Toggle availability"
                        />
                        <span className="status-toggle-track"><span className="status-toggle-thumb" /></span>
                        <span className="status-toggle-label">{car.status === 'maintenance' ? 'Maintenance' : 'Available'}</span>
                      </label>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn-icon" onClick={() => openEdit(car)} aria-label="Edit"><Pencil size={16} /></button>
                        <button type="button" className="btn-icon" onClick={() => setDeleting(car)} aria-label="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(editing)}
        title={editing === 'new' ? 'Add vehicle' : 'Edit vehicle'}
        onClose={close}
        size={720}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={close}>Cancel</button>
            <button type="submit" form="car-form" className="btn btn-gold">{editing === 'new' ? 'Add vehicle' : 'Save changes'}</button>
          </>
        }
      >
        <form id="car-form" className="form-grid" onSubmit={save} noValidate>
          <div className="field span-2">
            <label>Photos</label>
            <PhotoManager photos={photos} onChange={setPhotos} onError={(msg) => toast(msg, 'error')} />
          </div>
          <div className="field">
            <label>Model name</label>
            <input className="input" value={form.name} onChange={set('name')} placeholder="Chevrolet Malibu" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="field">
            <label>Year</label>
            <input className="input" type="number" min="1990" max="2100" value={form.year} onChange={set('year')} />
          </div>
          <div className="field">
            <label>Category</label>
            <select className="select" value={form.category} onChange={set('category')}>
              {carCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Color</label>
            <input className="input" value={form.color} onChange={set('color')} placeholder="Midnight Blue" />
          </div>
          <div className="field">
            <label>License plate</label>
            <input className="input" value={form.plate} onChange={set('plate')} placeholder="GB-0000" />
            {errors.plate && <span className="form-error">{errors.plate}</span>}
          </div>
          <div className="field">
            <label>Seats</label>
            <input className="input" type="number" min="2" max="15" value={form.seats} onChange={set('seats')} />
          </div>
          <div className="field">
            <label>Transmission</label>
            <select className="select" value={form.transmission} onChange={set('transmission')}>
              <option>Automatic</option>
              <option>Manual</option>
            </select>
          </div>
          <div className="field">
            <label>Fuel</label>
            <select className="select" value={form.fuel} onChange={set('fuel')}>
              <option>Gasoline</option>
              <option>Diesel</option>
              <option>Hybrid</option>
              <option>Electric</option>
            </select>
          </div>
          <div className="field">
            <label>Daily rate (USD)</label>
            <input className="input" type="number" min="1" value={form.dailyRate} onChange={set('dailyRate')} />
            {errors.dailyRate && <span className="form-error">{errors.dailyRate}</span>}
          </div>
          <div className="field">
            <label>Status</label>
            <select className="select" value={form.status} onChange={set('status')}>
              {['available', 'maintenance'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="field span-2">
            <label>Features (comma separated)</label>
            <input className="input" value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="Air conditioning, Bluetooth audio, Backup camera" />
          </div>
          <div className="field span-2">
            <label>Description</label>
            <textarea className="textarea" value={form.description} onChange={set('description')} placeholder="Short description shown on the website." />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove vehicle"
        message={deleting ? `Remove the ${deleting.year} ${deleting.name} (${deleting.plate}) from the fleet? Existing bookings will keep their records.` : ''}
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
