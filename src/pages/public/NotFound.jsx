import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="container not-found">
      <span className="eyebrow">Error 404</span>
      <h1 className="gold-text mt-2">Lost at sea</h1>
      <p className="muted mt-2">We could not find the page you were looking for.</p>
      <Link to="/" className="btn btn-gold mt-6">Back to home</Link>
    </section>
  )
}
