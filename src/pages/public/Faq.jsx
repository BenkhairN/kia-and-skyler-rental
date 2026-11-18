import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useData } from '../../context/DataContext'
import Reveal from '../../components/ui/Reveal'

export const faqs = [
  {
    q: 'How old do I have to be to rent?',
    a: 'Drivers must be 25 or older and hold a valid drivers license.',
  },
  {
    q: 'How much is the deposit?',
    a: 'A simple $100 refundable deposit. It is returned in full when the car comes back in the same condition.',
  },
  {
    q: 'How much does a rental cost?',
    a: 'Rates start at $70.00 per day depending on the vehicle. Your exact total (days x rate + deposit) is shown live on the booking page before you send the request.',
  },
  {
    q: 'Do you deliver or pick up the car?',
    a: 'Yes, pick up and drop off anywhere on Grand Bahama Island: the airport, the cruise port, Port Lucaya, your hotel or your residence.',
  },
  {
    q: 'What are your hours?',
    a: 'We are available 24 hours a day, every day. Early flights and late arrivals are no problem.',
  },
  {
    q: 'How do I book?',
    a: 'Pick a car on the Rent page, choose your dates and send the request. We confirm it by phone or WhatsApp, and you pay when you pick up the car.',
  },
  {
    q: 'Can I check on my booking?',
    a: 'Yes. When you book you get a reference (like BK-1008). Enter it with your phone number on the My Booking page to see your status any time.',
  },
  {
    q: 'Can I cancel a booking?',
    a: 'Yes, just call or message us before your pick-up date and we will cancel it and free up the dates.',
  },
]

export default function Faq() {
  const { settings } = useData()
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="section page-section">
      <div className="container narrow">
        <div className="section-head center">
          <div>
            <span className="eyebrow">FAQ</span>
            <h1 className="section-title">Common questions</h1>
            <p className="section-sub">
              Everything about renting from us. Still unsure? Call or WhatsApp {settings.phone}.
            </p>
          </div>
        </div>

        <div className="faq-list">
          {faqs.map((f, i) => {
            const open = openIndex === i
            return (
              <Reveal key={f.q} className={`faq-item card ${open ? 'open' : ''}`} delay={i * 40}>
                <button type="button" className="faq-q" onClick={() => setOpenIndex(open ? -1 : i)} aria-expanded={open}>
                  <span>{f.q}</span>
                  <ChevronDown size={18} className="faq-chev" />
                </button>
                <div className="faq-a">
                  <p>{f.a}</p>
                </div>
              </Reveal>
            )
          })}
        </div>

        <div className="faq-cta">
          <p>Ready to hit the road?</p>
          <Link to="/fleet" className="btn btn-gold">Browse vehicles</Link>
        </div>
      </div>
    </section>
  )
}
