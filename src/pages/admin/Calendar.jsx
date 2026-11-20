import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarX, ChevronLeft, ChevronRight } from 'lucide-react'
import { useData } from '../../context/DataContext'
import EmptyState from '../../components/ui/EmptyState'
import { toISO, addDays } from '../../utils/availability'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const monthLabel = (year, month) =>
  new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

export default function Calendar() {
  const { cars, bookings } = useData()
  const navigate = useNavigate()
  const today = toISO(new Date())

  const [view, setView] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const carById = (id) => cars.find((c) => c.id === id)

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1)
    const offset = first.getDay()
    const count = new Date(view.year, view.month + 1, 0).getDate()
    const list = []
    for (let i = 0; i < offset; i += 1) list.push(null)
    for (let d = 1; d <= count; d += 1) list.push(toISO(new Date(view.year, view.month, d)))
    return list
  }, [view])

  const byDay = useMemo(() => {
    const map = {}
    bookings.forEach((b) => {
      if (b.status === 'cancelled') return
      let cursor = b.pickupDate
      let guard = 0
      while (cursor <= b.returnDate && guard < 400) {
        ;(map[cursor] ||= []).push(b)
        cursor = addDays(cursor, 1)
        guard += 1
      }
    })
    Object.values(map).forEach((list) =>
      list.sort((a, b) => a.pickupDate.localeCompare(b.pickupDate) || a.id.localeCompare(b.id)),
    )
    return map
  }, [bookings])

  const move = (delta) =>
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  const goToday = () => {
    const d = new Date()
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }

  const open = (b) => navigate(`/admin/bookings?q=${encodeURIComponent(b.id)}`)

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Calendar</h1>
          <p>Which vehicle is out on which day. Click a booking to open it in the bookings list.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={goToday}>This month</button>
      </header>

      <section className="card card-pad">
        <div className="cal-toolbar">
          <div className="cal-nav">
            <button type="button" className="btn-icon" onClick={() => move(-1)} aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <h2>{monthLabel(view.year, view.month)}</h2>
            <button type="button" className="btn-icon" onClick={() => move(1)} aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="cal-legend">
            <span><i className="cal-dot st-pending" /> Pending</span>
            <span><i className="cal-dot st-confirmed" /> Confirmed</span>
            <span><i className="cal-dot st-active" /> Picked up</span>
            <span><i className="cal-dot st-completed" /> Completed</span>
          </div>
        </div>

        <div className="cal-weekdays">
          {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
        </div>

        <div className="cal-month">
          {cells.map((iso, i) => {
            if (!iso) return <div key={`e-${i}`} className="cal-cell cal-empty" />
            const day = Number(iso.slice(8, 10))
            const list = byDay[iso] || []
            const shown = list.slice(0, 3)
            return (
              <div key={iso} className={`cal-cell ${iso === today ? 'is-today' : ''} ${iso < today ? 'is-past' : ''}`}>
                <span className="cal-num">{day}</span>
                <div className="cal-chips">
                  {shown.map((b) => {
                    const car = carById(b.carId)
                    const starts = b.pickupDate === iso
                    return (
                      <button
                        key={b.id}
                        type="button"
                        className={`cal-chip st-${b.status} ${starts ? 'is-start' : ''}`}
                        title={`${b.id} · ${car?.name || 'Vehicle'} · ${b.status} (${b.pickupDate} → ${b.returnDate})`}
                        onClick={() => open(b)}
                      >
                        {b.customerName || 'Booking'}
                      </button>
                    )
                  })}
                  {list.length > shown.length && <span className="cal-more">+{list.length - shown.length} more</span>}
                </div>
              </div>
            )
          })}
        </div>

        {bookings.filter((b) => b.status !== 'cancelled').length === 0 && (
          <EmptyState icon={CalendarX} title="No bookings" text="Bookings will appear on the calendar as they come in." />
        )}
      </section>
    </>
  )
}
