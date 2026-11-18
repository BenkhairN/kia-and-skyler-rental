import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, toISO } from '../../utils/availability'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const monthLabel = (year, month) =>
  new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

export default function AvailabilityCalendar({ pickupDate, returnDate, bookedDates, minDate, onChange, disabled = false }) {
  const start = pickupDate || minDate
  const [view, setView] = useState(() => {
    const d = new Date(`${start}T00:00:00`)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [hover, setHover] = useState(null)

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1)
    const offset = first.getDay()
    const count = new Date(view.year, view.month + 1, 0).getDate()
    const list = []
    for (let i = 0; i < offset; i += 1) list.push(null)
    for (let d = 1; d <= count; d += 1) list.push(toISO(new Date(view.year, view.month, d)))
    return list
  }, [view])

  const move = (delta) =>
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  const canGoBack = () => {
    const prev = new Date(view.year, view.month, 0)
    return toISO(prev) >= minDate.slice(0, 8) + '01'
  }

  const rangeHasBooked = (a, b) => {
    let cursor = a
    let guard = 0
    while (cursor <= b && guard < 400) {
      if (bookedDates.has(cursor)) return true
      cursor = addDays(cursor, 1)
      guard += 1
    }
    return false
  }

  const pick = (iso) => {
    if (disabled || iso < minDate || bookedDates.has(iso)) return
    if (iso === pickupDate) {
      onChange({ pickupDate: '', returnDate: '' })
      return
    }
    if (iso === returnDate) {
      onChange({ pickupDate, returnDate: '' })
      return
    }
    if (!pickupDate || (pickupDate && returnDate) || iso <= pickupDate) {
      onChange({ pickupDate: iso, returnDate: '' })
      return
    }
    if (rangeHasBooked(pickupDate, iso)) {
      onChange({ pickupDate: iso, returnDate: '' })
      return
    }
    onChange({ pickupDate, returnDate: iso })
  }

  const previewEnd = returnDate || (pickupDate && hover && hover > pickupDate ? hover : null)
  const previewInvalid = !returnDate && pickupDate && previewEnd ? rangeHasBooked(pickupDate, previewEnd) : false

  return (
    <div className={`calendar ${disabled ? 'calendar-disabled' : ''}`} onMouseLeave={() => setHover(null)}>
      <div className="calendar-head">
        <button type="button" className="btn-icon" onClick={() => move(-1)} disabled={!canGoBack()} aria-label="Previous month">
          <ChevronLeft size={16} />
        </button>
        <strong>{monthLabel(view.year, view.month)}</strong>
        <button type="button" className="btn-icon" onClick={() => move(1)} aria-label="Next month">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="calendar-grid calendar-weekdays">
        {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className="calendar-grid">
        {cells.map((iso, i) => {
          if (!iso) return <span key={`empty-${i}`} />
          const past = iso < minDate
          const booked = bookedDates.has(iso)
          const isStart = iso === pickupDate
          const isEnd = iso === returnDate
          const inRange = pickupDate && previewEnd && iso > pickupDate && iso < previewEnd && !previewInvalid
          const isPreviewEnd = !returnDate && iso === previewEnd && !previewInvalid
          const classes = [
            'calendar-day',
            past || booked ? 'is-disabled' : '',
            booked ? 'is-booked' : '',
            isStart ? 'is-start' : '',
            isEnd || isPreviewEnd ? 'is-end' : '',
            inRange ? 'in-range' : '',
            iso === minDate ? 'is-today' : '',
          ].filter(Boolean).join(' ')
          return (
            <button
              key={iso}
              type="button"
              className={classes}
              onClick={() => pick(iso)}
              onMouseEnter={() => setHover(iso)}
              onFocus={() => setHover(iso)}
              disabled={disabled || past || booked}
              aria-label={`${iso}${booked ? ' (unavailable)' : ''}`}
              aria-pressed={isStart || isEnd}
            >
              {Number(iso.slice(-2))}
            </button>
          )
        })}
      </div>

      <div className="calendar-legend">
        <span><i className="legend-dot legend-free" /> Available</span>
        <span><i className="legend-dot legend-booked" /> Unavailable</span>
        <span><i className="legend-dot legend-selected" /> Your dates</span>
      </div>
    </div>
  )
}
