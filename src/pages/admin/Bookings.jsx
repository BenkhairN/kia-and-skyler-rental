import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, CalendarX, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { bookingStatuses } from '../../data/bookings'
import { pickupLocations } from '../../data/site'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { daysBetween, formatCurrency, formatDate, initials, statusTone, todayISO } from '../../utils/format'
import { findConflicts } from '../../utils/availability'

const cap = (s) => s[0].toUpperCase() + s.slice(1)
const selectableStatuses = bookingStatuses.filter((s) => s !== 'active')
const shortDate = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
const shortStamp = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
const timeStamp = (d) =>
  new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

function SortTh({ id, sort, onSort, children }) {
  const active = sort.key === id
  return (
    <th>
      <button type="button" className={`th-sort ${active ? 'active' : ''}`} onClick={() => onSort(id)}>
        {children}
        {active ? (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
      </button>
    </th>
  )
}

const emptyForm = {
  carId: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  pickupLocation: pickupLocations[0],
  pickupDate: '',
  returnDate: '',
  status: 'confirmed',
  notes: '',
}

export default function Bookings() {
  const { cars, bookings, settings, addBooking, updateBooking, deleteBooking } = useData()
  const { toast } = useToast()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState({ key: 'createdAt', dir: -1 })
  const [viewing, setViewing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const carById = (id) => cars.find((c) => c.id === id)

  const sortValue = (b, key) => {
    switch (key) {
      case 'id': return b.id
      case 'customer': return b.customerName.toLowerCase()
      case 'vehicle': { const c = carById(b.carId); return c ? `${c.name} ${c.year}` : '' }
      case 'pickupDate': return b.pickupDate
      case 'createdAt': return b.createdAt
      case 'total': return b.total
      case 'status': return b.status
      default: return ''
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...bookings]
      .filter((b) => {
        const car = carById(b.carId)
        const text = `${b.id} ${b.customerName} ${b.customerPhone} ${b.customerEmail} ${car?.name || ''}`.toLowerCase()
        return (!q || text.includes(q)) && (status === 'all' || b.status === status)
      })
      .sort((a, b) => {
        const va = sortValue(a, sort.key)
        const vb = sortValue(b, sort.key)
        return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, cars, query, status, sort])

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: -1 }))

  const th = (id, children) => (
    <SortTh key={id} id={id} sort={sort} onSort={toggleSort}>{children}</SortTh>
  )

  const counts = bookingStatuses.reduce((acc, s) => ({ ...acc, [s]: bookings.filter((b) => b.status === s).length }), {})

  const changeStatus = async (booking, next) => {
    try {
      await updateBooking(booking.id, { status: next })
      toast(`Booking ${booking.id} marked ${next}`, 'success')
    } catch (err) {
      toast(`Could not update: ${err.message}`, 'error')
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const formCar = carById(form.carId)
  const formDays = daysBetween(form.pickupDate, form.returnDate)
  const formConflicts = findConflicts(bookings, { ...form, id: editing?.id || null })
  const conflictsFor = (b) => findConflicts(bookings, b)

  const closeForm = () => {
    setCreating(false)
    setEditing(null)
  }

  const openEdit = (b) => {
    setForm({
      carId: b.carId,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      customerEmail: b.customerEmail || '',
      pickupLocation: b.pickupLocation || pickupLocations[0],
      pickupDate: b.pickupDate,
      returnDate: b.returnDate,
      status: b.status === 'active' ? 'confirmed' : b.status,
      notes: b.notes || '',
    })
    setErrors({})
    setViewing(null)
    setEditing(b)
  }

  const submitForm = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.carId) next.carId = 'Choose a vehicle.'
    if (!form.customerName.trim()) next.customerName = 'Name is required.'
    if (!form.customerPhone.trim()) next.customerPhone = 'Phone is required.'
    if (!form.pickupDate || !form.returnDate || formDays < 1) next.returnDate = 'Choose a valid date range.'
    setErrors(next)
    if (Object.keys(next).length) return
    const payload = {
      ...form,
      days: formDays,
      dailyRate: formCar?.dailyRate || 0,
      deposit: editing ? editing.deposit : settings.deposit,
      total: formDays * (formCar?.dailyRate || 0),
    }
    try {
      if (editing) {
        await updateBooking(editing.id, payload)
        toast(`Booking ${editing.id} updated`, 'success')
      } else {
        const id = await addBooking(payload)
        toast(`Booking ${id} created`, 'success')
        setForm(emptyForm)
      }
      closeForm()
    } catch (err) {
      toast(`Could not save booking: ${err.message}`, 'error')
    }
  }

  const confirmDelete = async () => {
    try {
      await deleteBooking(deleting.id)
      toast('Booking deleted', 'success')
    } catch (err) {
      toast(`Could not delete: ${err.message}`, 'error')
    }
    setDeleting(null)
  }

  const viewingCar = viewing ? carById(viewing.carId) : null

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Bookings</h1>
          <p>{bookings.length} total &middot; {counts.pending} pending &middot; {counts.active} active</p>
        </div>
        <button type="button" className="btn btn-gold" onClick={() => { setForm(emptyForm); setErrors({}); setCreating(true) }}>
          <Plus size={16} />
          New booking
        </button>
      </header>

      <section className="card">
        <div className="toolbar">
          <div className="input-icon">
            <Search size={16} />
            <input className="input" placeholder="Search reference, customer or vehicle" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="chip-row">
            <button type="button" className={`chip ${status === 'all' ? 'active' : ''}`} onClick={() => setStatus('all')}>All</button>
            {bookingStatuses.map((s) => (
              <button key={s} type="button" className={`chip ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
                {cap(s)} ({counts[s]})
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={CalendarX} title="No bookings found" text="Try another filter or create a booking manually." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {th('id', 'Reference')}
                  {th('customer', 'Customer')}
                  {th('vehicle', 'Vehicle')}
                  {th('pickupDate', 'Dates')}
                  {th('createdAt', 'Booked')}
                  {th('total', 'Total')}
                  {th('status', 'Status')}
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const car = carById(b.carId)
                  const clash = conflictsFor(b)
                  return (
                    <tr key={b.id}>
                      <td className="td-strong">
                        <div className="flex items-center gap-2">
                          {b.id}
                          {clash.length > 0 && (
                            <span className="conflict-flag" title={`Overlaps with ${clash.map((c) => c.id).join(', ')}`}>
                              <AlertTriangle size={14} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="cell-person">
                          <div className="avatar avatar-sm">{initials(b.customerName)}</div>
                          <div>
                            <strong>{b.customerName}</strong>
                            <span>{b.customerPhone}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="cell-vehicle">
                          <strong>{car ? `${car.year} ${car.name}` : 'Removed vehicle'}</strong>
                          {car && <span>{car.color}</span>}
                        </div>
                      </td>
                      <td className="td-muted">{shortDate(b.pickupDate)} – {shortDate(b.returnDate)}</td>
                      <td className="td-muted">
                        {shortStamp(b.createdAt)}
                        <div className="small" style={{ opacity: 0.7 }}>{timeStamp(b.createdAt)}</div>
                      </td>
                      <td className="td-strong">{formatCurrency(b.total)}</td>
                      <td>
                        <div className="status-cell">
                          <select
                            className={`select status-select tone-${statusTone(b.status)}`}
                            value={b.status}
                            onChange={(e) => changeStatus(b, e.target.value)}
                            aria-label="Change status"
                          >
                            {bookingStatuses
                              .filter((s) => s !== 'active' || s === b.status)
                              .map((s) => <option key={s} value={s}>{cap(s)}</option>)}
                          </select>
                          <span className="status-active-slot">
                            {b.status === 'confirmed' && b.pickupDate <= todayISO() && b.returnDate >= todayISO() && (
                              <span className="badge badge-success">Active</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="btn-icon" onClick={() => setViewing(b)} aria-label="View"><Eye size={16} /></button>
                          <button type="button" className="btn-icon" onClick={() => openEdit(b)} aria-label="Edit"><Pencil size={16} /></button>
                          <button type="button" className="btn-icon" onClick={() => setDeleting(b)} aria-label="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={Boolean(viewing)} title={`Booking ${viewing?.id || ''}`} onClose={() => setViewing(null)} size={560}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={async () => {
                try {
                  await updateBooking(viewing.id, { paid: !viewing.paid })
                  setViewing((v) => ({ ...v, paid: !v.paid }))
                  toast(viewing.paid ? 'Marked as unpaid' : 'Marked as paid', 'success')
                } catch (err) {
                  toast(`Could not update: ${err.message}`, 'error')
                }
              }}
            >
              {viewing.paid ? 'Mark unpaid' : 'Mark paid'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => openEdit(viewing)}><Pencil size={16} /> Edit</button>
            <button type="button" className="btn btn-outline" onClick={() => setViewing(null)}>Close</button>
          </>
        }>
        {viewing && (
          <div className="detail-grid">
            <div className="span-2 flex items-center justify-between">
              <strong style={{ fontSize: 16 }}>{viewing.customerName}</strong>
              <Badge status={viewing.status} />
            </div>
            <div><span>Phone</span><strong>{viewing.customerPhone}</strong></div>
            <div><span>Email</span><strong>{viewing.customerEmail || '-'}</strong></div>
            <div><span>Vehicle</span><strong>{viewingCar ? `${viewingCar.year} ${viewingCar.name}` : 'Removed vehicle'}</strong></div>
            <div><span>Plate</span><strong>{viewingCar?.plate || '-'}</strong></div>
            <div><span>Pick-up</span><strong>{formatDate(viewing.pickupDate)}</strong></div>
            <div><span>Return</span><strong>{formatDate(viewing.returnDate)}</strong></div>
            <div className="span-2"><span>Pick-up location</span><strong>{viewing.pickupLocation}</strong></div>
            <div><span>Duration</span><strong>{viewing.days} {viewing.days === 1 ? 'day' : 'days'}</strong></div>
            <div><span>Total</span><strong className="gold-text">{formatCurrency(viewing.total)}</strong></div>
            <div><span>Payment</span><strong style={{ color: viewing.paid ? 'var(--green-400, #5bc27d)' : 'var(--text-muted)' }}>{viewing.paid ? 'Paid' : 'Unpaid'}</strong></div>
            <div className="span-2"><span>Notes</span><strong style={{ fontWeight: 400 }} className="muted">{viewing.notes || 'No notes'}</strong></div>
            <div><span>Requested on</span><strong>{formatDate(viewing.createdAt)}</strong></div>
            {conflictsFor(viewing).length > 0 && (
              <div className="span-2 conflict-note">
                <AlertTriangle size={16} />
                <span>
                  Dates overlap with {conflictsFor(viewing).map((c) => `${c.id} (${c.customerName}, ${formatDate(c.pickupDate)} - ${formatDate(c.returnDate)})`).join('; ')}.
                  Only one of these can be confirmed for this vehicle.
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={creating || Boolean(editing)} title={editing ? `Edit booking ${editing.id}` : 'New booking'} onClose={closeForm} size={680}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={closeForm}>Cancel</button>
            <button type="submit" form="booking-form" className="btn btn-gold">{editing ? 'Save changes' : 'Create booking'}</button>
          </>
        }>
        <form id="booking-form" className="form-grid" onSubmit={submitForm} noValidate>
          <div className="field span-2">
            <label>Vehicle</label>
            <select className="select" value={form.carId} onChange={set('carId')}>
              <option value="">Select a vehicle</option>
              {cars.map((c) => <option key={c.id} value={c.id}>{c.year} {c.name} ({c.plate}) - {formatCurrency(c.dailyRate)}/day</option>)}
            </select>
            {errors.carId && <span className="form-error">{errors.carId}</span>}
          </div>
          <div className="field">
            <label>Customer name</label>
            <input className="input" value={form.customerName} onChange={set('customerName')} />
            {errors.customerName && <span className="form-error">{errors.customerName}</span>}
          </div>
          <div className="field">
            <label>Phone</label>
            <input className="input" value={form.customerPhone} onChange={set('customerPhone')} />
            {errors.customerPhone && <span className="form-error">{errors.customerPhone}</span>}
          </div>
          <div className="field span-2">
            <label>Email</label>
            <input className="input" type="email" value={form.customerEmail} onChange={set('customerEmail')} />
          </div>
          <div className="field">
            <label>Pick-up date</label>
            <input className="input" type="date" value={form.pickupDate} onChange={set('pickupDate')} />
          </div>
          <div className="field">
            <label>Return date</label>
            <input className="input" type="date" value={form.returnDate} onChange={set('returnDate')} />
            {errors.returnDate && <span className="form-error">{errors.returnDate}</span>}
          </div>
          <div className="field">
            <label>Pick-up location</label>
            <select className="select" value={form.pickupLocation} onChange={set('pickupLocation')}>
              {pickupLocations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select className="select" value={form.status} onChange={set('status')}>
              {selectableStatuses.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
            </select>
          </div>
          <div className="field span-2">
            <label>Notes</label>
            <textarea className="textarea" value={form.notes} onChange={set('notes')} />
          </div>
          {formConflicts.length > 0 && (
            <div className="span-2 conflict-note">
              <AlertTriangle size={16} />
              <span>This vehicle is already booked on these dates: {formConflicts.map((c) => `${c.id} (${c.customerName})`).join(', ')}. You can still save it, but check with the customer.</span>
            </div>
          )}
          <div className="span-2 muted small">
            {formCar && formDays > 0
              ? `${formDays} ${formDays === 1 ? 'day' : 'days'} x ${formatCurrency(formCar.dailyRate)} = ${formatCurrency(formDays * formCar.dailyRate)}`
              : 'Select a vehicle and dates to see the total.'}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete booking"
        message={deleting ? `Permanently delete booking ${deleting.id} for ${deleting.customerName}?` : ''}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
