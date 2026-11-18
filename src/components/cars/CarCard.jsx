import { Link } from 'react-router-dom'
import { Fuel, Settings2, Users } from 'lucide-react'
import CarImage from '../ui/CarImage'
import Badge from '../ui/Badge'
import { carDisplayStatus, formatCurrency } from '../../utils/format'

export default function CarCard({ car }) {
  const status = carDisplayStatus(car)
  const maintenance = status === 'maintenance'

  return (
    <article className="car-card card">
      <Link to={`/fleet/${car.id}`} className="car-card-media">
        <CarImage src={car.image} alt={`${car.year} ${car.name}`} />
        <div className="car-card-badges">
          <Badge tone="neutral">{car.category}</Badge>
        </div>
      </Link>

      <div className="car-card-body">
        <div className="car-card-head">
          <div>
            <h3>
              {car.name}
            </h3>
            <span className="muted small">{car.year} &middot; {car.color}</span>
          </div>
          <div className="car-card-price">
            <strong className="gold-text">{formatCurrency(car.dailyRate)}</strong>
            <span>/ day</span>
          </div>
        </div>

        <ul className="car-specs">
          <li><Users size={15} /> {car.seats} seats</li>
          <li><Settings2 size={15} /> {car.transmission}</li>
          <li><Fuel size={15} /> {car.fuel}</li>
        </ul>

        <div className="car-card-actions">
          <Link to={`/fleet/${car.id}`} className="btn btn-outline btn-sm">
            Details
          </Link>
          <Link
            to={`/book?car=${car.id}`}
            className={maintenance ? 'btn btn-sm disabled status-btn status-maintenance' : 'btn btn-gold btn-sm'}
            aria-disabled={maintenance}
            onClick={(e) => maintenance && e.preventDefault()}
          >
            {maintenance ? 'Maintenance' : 'Book Now'}
          </Link>
        </div>
      </div>
    </article>
  )
}
