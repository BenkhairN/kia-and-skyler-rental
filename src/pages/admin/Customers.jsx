import { useMemo, useState } from 'react'
import { Mail, Phone, Search, Users } from 'lucide-react'
import { useData } from '../../context/DataContext'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency, formatDate, initials } from '../../utils/format'

export default function Customers() {
  const { bookings } = useData()
  const [query, setQuery] = useState('')

  const customers = useMemo(() => {
    const map = new Map()
    bookings.forEach((b) => {
      const key = (b.customerEmail || b.customerPhone || b.customerName).toLowerCase()
      const existing = map.get(key) || {
        key,
        name: b.customerName,
        email: b.customerEmail,
        phone: b.customerPhone,
        bookings: 0,
        spent: 0,
        lastDate: '',
      }
      existing.bookings += 1
      if (['active', 'completed'].includes(b.status)) existing.spent += b.total || 0
      if (b.pickupDate > existing.lastDate) existing.lastDate = b.pickupDate
      map.set(key, existing)
    })
    const q = query.trim().toLowerCase()
    return [...map.values()]
      .filter((c) => !q || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q))
      .sort((a, b) => b.spent - a.spent)
  }, [bookings, query])

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Customers</h1>
          <p>{customers.length} customers from your booking history.</p>
        </div>
        <div className="input-icon" style={{ minWidth: 280 }}>
          <Search size={16} />
          <input className="input" placeholder="Search customers" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </header>

      {customers.length === 0 ? (
        <div className="card">
          <EmptyState icon={Users} title="No customers yet" text="Customers appear here automatically once bookings come in." />
        </div>
      ) : (
        <div className="customer-grid">
          {customers.map((c) => (
            <article key={c.key} className="customer-card card">
              <header>
                <div className="avatar">{initials(c.name)}</div>
                <div>
                  <strong>{c.name}</strong>
                  <span>Last rental {formatDate(c.lastDate)}</span>
                </div>
              </header>
              <div className="customer-meta">
                <div><span>Bookings</span><strong>{c.bookings}</strong></div>
                <div><span>Total spent</span><strong className="gold-text">{formatCurrency(c.spent)}</strong></div>
              </div>
              <div className="customer-contact">
                <div><Phone size={14} /> {c.phone || '-'}</div>
                <div><Mail size={14} /> {c.email || '-'}</div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
