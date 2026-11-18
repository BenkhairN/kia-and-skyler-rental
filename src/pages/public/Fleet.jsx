import { useMemo, useState } from 'react'
import { Search, SearchX } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { carCategories } from '../../data/cars'
import { carDisplayStatus } from '../../utils/format'
import CarCard from '../../components/cars/CarCard'
import Reveal from '../../components/ui/Reveal'
import EmptyState from '../../components/ui/EmptyState'

export default function Fleet() {
  const { cars, bookings } = useData()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('price-asc')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = cars.filter((c) => {
      const matchesQuery = !q || `${c.name} ${c.year} ${c.color} ${c.category}`.toLowerCase().includes(q)
      const matchesCategory = category === 'All' || c.category === category
      return matchesQuery && matchesCategory
    })
    const sorted = [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.dailyRate - b.dailyRate
      if (sort === 'price-desc') return b.dailyRate - a.dailyRate
      if (sort === 'newest') return b.year - a.year
      return 0
    })
    return sorted.sort(
      (a, b) =>
        (carDisplayStatus(a, bookings) === 'available' ? 0 : 1) -
        (carDisplayStatus(b, bookings) === 'available' ? 0 : 1),
    )
  }, [cars, bookings, query, category, sort])

  const categories = ['All', ...carCategories.filter((c) => cars.some((car) => car.category === c))]

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Rent</span>
          <h1>Find your ride</h1>
          <p>Every vehicle is detailed and inspected before each rental. Prices shown are per day.</p>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 80 }}>
        <div className="filters">
          <div className="input-icon">
            <Search size={16} />
            <input
              className="input"
              placeholder="Search by model, year or color"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="chip-row">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="newest">Newest first</option>
          </select>
        </div>

        {filtered.length ? (
          <div className="car-grid">
            {filtered.map((car, i) => (
              <Reveal key={car.id} delay={(i % 6) * 80}>
                <CarCard car={car} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="card">
            <EmptyState icon={SearchX} title="No vehicles match" text="Try a different search or category." />
          </div>
        )}
      </section>
    </>
  )
}
