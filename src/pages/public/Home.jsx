import { Link } from 'react-router-dom'
import { ArrowRight, Clock, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { highlights } from '../../data/site'
import CarImage from '../../components/ui/CarImage'
import CarCard from '../../components/cars/CarCard'
import Reveal from '../../components/ui/Reveal'
import FeatureIcon from '../../components/ui/FeatureIcon'

const steps = [
  {
    title: 'Choose your vehicle',
    text: 'Browse our fleet and pick the car that fits your trip, from compact sedans to 8-seat vans.',
  },
  {
    title: 'Request your dates',
    text: 'Tell us when and where you need it. We confirm by phone or email, usually within the hour.',
  },
  {
    title: 'We deliver, you drive',
    text: 'We meet you at the airport, cruise port, or hotel with a clean car and keys in hand.',
  },
]

export default function Home() {
  const { cars, settings } = useData()
  const featured = cars.slice(0, 3)

  return (
    <>
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-grid">
          <div>
            <span className="eyebrow hero-in">{settings.tagline}</span>
            <h1 className="hero-title">
              <img src="/images/logo.webp" alt="Kia & Skyler Rentals" className="hero-logo hero-in hero-d1" />
            </h1>
            <p className="hero-text hero-in hero-d2">
              Clean, reliable vehicles delivered to you anywhere on Grand Bahama Island. Simple pricing,
              a small refundable deposit, and friendly service around the clock.
            </p>
            <div className="hero-actions hero-in hero-d3">
              <Link to="/book" className="btn btn-gold btn-lg">
                Book a Car
                <ArrowRight size={18} />
              </Link>
              <Link to="/fleet" className="btn btn-outline btn-lg">
                View Car
              </Link>
            </div>
            <div className="hero-meta hero-in hero-d4">
              <div><Phone size={16} /> {settings.phone}</div>
              <div><Clock size={16} /> {settings.hours}</div>
              <div><ShieldCheck size={16} /> ${settings.deposit} refundable deposit</div>
            </div>
          </div>

          <div className="hero-visual hero-in hero-d3">
            <div className="hero-card">
              {settings.heroImage ? (
                <CarImage key={settings.heroImage} src={settings.heroImage} alt={settings.businessName} label="Hero photo coming soon" iconSize={64} />
              ) : (
                <div className="hero-logo-panel">
                  <img src="/images/logo-script.webp" alt="" className="hero-logo-tall" />
                </div>
              )}
            </div>
            <div className="price-tag hero-pop">
              <small>Price</small>
              <strong className="gold-text">
                ${settings.dailyRate}
                <sup>.00</sup>
              </strong>
              <span>A Day</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="section-head center">
            <div>
              <span className="eyebrow">Why rent with us</span>
              <h2 className="section-title">Everything you need, nothing you don't</h2>
              <p className="section-sub">
                Straightforward rentals built around island travel. No hidden fees, no long lines.
              </p>
            </div>
          </div>
          <div className="feature-grid">
            {highlights.map((h, i) => (
              <Reveal key={h.title} className="feature card" delay={i * 70}>
                <div className="feature-icon">
                  <FeatureIcon name={h.icon} />
                </div>
                <div>
                  <h3>{h.title}</h3>
                  <p>{h.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Rent</span>
              <h2 className="section-title">Popular vehicles</h2>
              <p className="section-sub">Well-maintained cars ready for the road.</p>
            </div>
            <Link to="/fleet" className="btn btn-outline">
              See all vehicles
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="car-grid">
            {featured.map((car, i) => (
              <Reveal key={car.id} delay={i * 90}>
                <CarCard car={car} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head center">
            <div>
              <span className="eyebrow">How it works</span>
              <h2 className="section-title">Three simple steps</h2>
            </div>
          </div>
          <div className="steps">
            {steps.map((s, i) => (
              <Reveal key={s.title} className="step card" delay={i * 110}>
                <div className="step-num">{i + 1}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal className="cta-band">
            <div>
              <span className="script gold-text">Serving</span>
              <h2>Grand Bahama Island</h2>
              <p>
                <MapPin size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                Freeport, Lucaya, West End and everywhere in between.
              </p>
            </div>
            <div className="cta-band-actions">
              <a href={settings.phoneHref} className="btn btn-outline btn-lg">
                <Phone size={18} />
                Call {settings.phone}
              </a>
              <Link to="/book" className="btn btn-gold btn-lg">
                Book Now
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
