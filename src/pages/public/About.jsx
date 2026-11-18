import { Link } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { highlights } from '../../data/site'
import CarImage from '../../components/ui/CarImage'
import FeatureIcon from '../../components/ui/FeatureIcon'
import Reveal from '../../components/ui/Reveal'

export default function About() {
  const { settings, cars } = useData()

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">About us</span>
          <h1>Local, reliable, always on call</h1>
          <p>A family-run rental service built for visitors and locals on Grand Bahama Island.</p>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 40 }}>
        <div className="about-grid">
          <div className="about-media">
            <CarImage src={settings.aboutImage || '/images/Tropical%20Paradise%20Resort%20Coastline.png'} alt="Tropical coastline with white sandy beaches and turquoise water" />
          </div>
          <div className="about-text">
            <h2 className="section-title">Island driving made easy</h2>
            <p>
              Kia &amp; Skyler Rentals started with a simple idea: visitors to Grand Bahama deserve a clean,
              dependable car without the counter lines and surprise fees. We keep a small, well-kept fleet
              and handle every rental personally.
            </p>
            <p>
              Whether you are landing at the airport, stepping off a cruise ship, or need wheels for the
              week, we deliver the car to you and pick it up when you are done.
            </p>
            <div className="stat-row">
              <div className="card"><strong className="gold-text">{cars.length}</strong><span>Vehicles</span></div>
              <div className="card"><strong className="gold-text">24/7</strong><span>Availability</span></div>
              <div className="card"><strong className="gold-text">${settings.dailyRate}</strong><span>From / day</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Rental policy</span>
              <h2 className="section-title">What to expect</h2>
            </div>
            <Link to="/book" className="btn btn-gold">Book a Car</Link>
          </div>
          <div className="feature-grid">
            {highlights.map((h, i) => (
              <Reveal key={h.title} className="feature card" delay={i * 70}>
                <div className="feature-icon"><FeatureIcon name={h.icon} /></div>
                <div>
                  <h3>{h.title}</h3>
                  <p>{h.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
