import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck, CarFront, Clock, DollarSign } from 'lucide-react'
import { useData } from '../../context/DataContext'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import { carDisplayStatus, formatCurrency, formatDate, initials } from '../../utils/format'

const monthLabel = (date) => date.toLocaleDateString('en-US', { month: 'short' })

export default function Dashboard() {
  const { cars, bookings } = useData()

  const available = cars.filter((c) => carDisplayStatus(c, bookings) === 'available').length
  const maintenance = cars.filter((c) => carDisplayStatus(c, bookings) === 'maintenance').length
  const pending = bookings.filter((b) => b.status === 'pending').length
  const activeBookings = bookings.filter((b) => ['confirmed', 'active'].includes(b.status)).length
  const revenue = bookings
    .filter((b) => ['active', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + (b.total || 0), 0)

  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const total = bookings
      .filter((b) => b.status !== 'cancelled')
      .filter((b) => {
        const bd = new Date(`${b.pickupDate}T00:00:00`)
        return `${bd.getFullYear()}-${bd.getMonth()}` === key
      })
      .reduce((sum, b) => sum + (b.total || 0), 0)
    return { label: monthLabel(d), total }
  })
  const maxTotal = Math.max(...months.map((m) => m.total), 1)

  const recent = [...bookings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6)

  const fleetRows = [
    { label: 'Available', value: available, tone: 'success' },
    { label: 'In maintenance', value: maintenance, tone: 'warning' },
  ]

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your fleet and bookings.</p>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard icon={CarFront} label="Total vehicles" value={cars.length} hint={`${available} available now`} tone="blue" />
        <StatCard icon={CalendarCheck} label="Active & confirmed" value={activeBookings} hint={`${pending} pending approval`} tone="gold" />
        <StatCard icon={DollarSign} label="Revenue" value={formatCurrency(revenue)} hint="Active and completed rentals" tone="green" />
        <StatCard icon={Clock} label="Pending requests" value={pending} hint="Waiting for confirmation" tone="red" />
      </div>

      <div className="dash-grid">
        <section className="card panel">
          <div className="panel-head">
            <h3>Revenue by month</h3>
            <span className="muted small">Last 6 months</span>
          </div>
          <div className="panel-body">
            <div className="bars">
              {months.map((m) => (
                <div key={m.label} className="bar-col">
                  <div
                    className="bar"
                    style={{ height: `${Math.max((m.total / maxTotal) * 100, 3)}%` }}
                    data-value={m.total ? formatCurrency(m.total) : ''}
                  />
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card panel">
          <div className="panel-head">
            <h3>Fleet status</h3>
            <Link to="/admin/cars">Manage <ArrowRight size={14} /></Link>
          </div>
          <div className="panel-body status-list">
            {fleetRows.map((row) => (
              <div key={row.label} className="status-row">
                <header>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </header>
                <div className={`progress progress-${row.tone}`}>
                  <span style={{ width: `${cars.length ? (row.value / cars.length) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card panel">
          <div className="panel-head">
            <h3>Recent bookings</h3>
            <Link to="/admin/bookings">All bookings <ArrowRight size={14} /></Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Dates</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((b) => {
                  const car = cars.find((c) => c.id === b.carId)
                  return (
                    <tr key={b.id}>
                      <td>
                        <div className="cell-person">
                          <div className="avatar avatar-sm">{initials(b.customerName)}</div>
                          <div>
                            <strong>{b.customerName}</strong>
                            <span>{b.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="td-muted">{car ? `${car.year} ${car.name}` : 'Removed vehicle'}</td>
                      <td className="td-muted">{formatDate(b.pickupDate)} - {formatDate(b.returnDate)}</td>
                      <td className="td-strong">{formatCurrency(b.total)}</td>
                      <td><Badge status={b.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  )
}
