import { Link } from 'react-router-dom'
import Reveal from '../../components/ui/Reveal'
import { CalendarDays, Clock, Mail, MapPin, Phone } from 'lucide-react'
import { useData } from '../../context/DataContext'

export default function Contact() {
  const { settings } = useData()

  const items = [
    { icon: Phone, title: 'Call or text', value: settings.phone, href: settings.phoneHref },
    { icon: Mail, title: 'Email', value: settings.email, href: `mailto:${settings.email}` },
    { icon: MapPin, title: 'Location', value: settings.address },
    { icon: Clock, title: 'Hours', value: settings.hours },
  ]

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Contact</span>
          <h1>Get in touch</h1>
          <p>Questions about availability, pricing or delivery? We are here around the clock.</p>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 80 }}>
        <div className="contact-cards">
          {items.map(({ icon: Icon, title, value, href }, i) => (
            <Reveal key={title} className="contact-item card" delay={i * 80}>
              <div className="feature-icon"><Icon size={22} /></div>
              <div>
                <h4>{title}</h4>
                {href ? <a href={href} className="contact-value">{value}</a> : <p className="contact-value">{value}</p>}
                {title === 'Call or text' && <a href={settings.secondaryPhoneHref} className="contact-value">{settings.secondaryPhone}</a>}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="cta-band mt-6">
          <div>
            <span className="script gold-text">Need a car?</span>
            <h2>Call us or book online</h2>
            <p>Reserve in under a minute — we confirm by phone or email.</p>
          </div>
          <div className="cta-band-actions">
            <a href={settings.phoneHref} className="btn btn-outline btn-lg">
              <Phone size={18} />
              Call {settings.phone}
            </a>
            <Link to="/book" className="btn btn-gold btn-lg">
              <CalendarDays size={18} />
              Book a car
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  )
}
