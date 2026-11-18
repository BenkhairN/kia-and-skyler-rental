import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Check, Clock, Fuel, Gauge, Palette, Settings2, ShieldCheck, UserRound, Users } from 'lucide-react'
import { useData } from '../../context/DataContext'
import CarImage from '../../components/ui/CarImage'
import Badge from '../../components/ui/Badge'
import { carDisplayStatus, formatCurrency } from '../../utils/format'
import NotFound from './NotFound'

export default function CarDetails() {
  const { id } = useParams()
  const { getCar, settings, bookings } = useData()
  const car = getCar(id)
  const [active, setActive] = useState(0)

  if (!car) return <NotFound />

  const photos = [car.image, ...(car.gallery || [])].filter(Boolean)
  const current = photos[Math.min(active, photos.length - 1)] || ''

  const status = carDisplayStatus(car, bookings)
  const available = status !== 'maintenance'
  const specs = [
    { icon: Users, label: 'Seats', value: `${car.seats} passengers` },
    { icon: Settings2, label: 'Transmission', value: car.transmission },
    { icon: Fuel, label: 'Fuel', value: car.fuel },
    { icon: Palette, label: 'Color', value: car.color },
    { icon: Gauge, label: 'Category', value: car.category },
    { icon: CalendarDays, label: 'Year', value: car.year },
  ]

  return (
    <section className="section">
      <div className="container">
        <Link to="/fleet" className="back-link">
          <ArrowLeft size={16} />
          Back to fleet
        </Link>

        <div className="details-grid">
          <div>
            <div className="details-media">
              <CarImage key={current} src={current} alt={`${car.year} ${car.name}`} iconSize={64} />
            </div>
            {photos.length > 1 && (
              <div className="details-thumbs">
                {photos.map((src, i) => (
                  <button
                    key={`${i}-${src.slice(-24)}`}
                    type="button"
                    className={`details-thumb ${src === current ? 'active' : ''}`}
                    onClick={() => setActive(i)}
                    aria-label={`Show photo ${i + 1}`}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 wrap" style={{ marginTop: 28 }}>
              <h1 style={{ fontSize: 32, fontWeight: 800 }}>{car.name}</h1>
              <Badge status={status} />
            </div>
            <p className="muted mt-2">{car.year} &middot; {car.color} &middot; {car.category}</p>
            <p className="muted" style={{ marginTop: 18, fontSize: 16 }}>{car.description}</p>

            <div className="spec-grid">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="spec">
                  <Icon size={20} />
                  <div>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                </div>
              ))}
            </div>

            {car.features?.length > 0 && (
              <>
                <h3 style={{ fontSize: 18, marginTop: 32 }}>Features</h3>
                <ul className="feature-list">
                  {car.features.map((f) => (
                    <li key={f}>
                      <Check size={16} />
                      {f}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <aside className="booking-side card card-pad">
            <span className="eyebrow">Daily rate</span>
            <div className="price-row mt-2">
              <strong className="gold-text">{formatCurrency(car.dailyRate)}</strong>
              <span>/ day</span>
            </div>

            <ul className="info-list">
              <li><ShieldCheck size={18} /> {formatCurrency(settings.deposit)} refundable deposit</li>
              <li><UserRound size={18} /> Drivers must be {settings.minAge} or older</li>
              <li><Clock size={18} /> Pick up and drop off included</li>
            </ul>

            <Link
              to={`/book?car=${car.id}`}
              className={`btn btn-gold btn-lg ${available ? '' : 'disabled'}`}
              style={{ width: '100%', marginTop: 24 }}
              onClick={(e) => !available && e.preventDefault()}
            >
              {available ? 'Reserve this car' : 'In maintenance'}
            </Link>
            <a href={settings.phoneHref} className="btn btn-outline" style={{ width: '100%', marginTop: 10 }}>
              Call {settings.phone}
            </a>
          </aside>
        </div>
      </div>
    </section>
  )
}
