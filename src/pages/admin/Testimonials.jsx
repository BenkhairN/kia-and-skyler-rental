import { useState } from 'react'
import { MessageSquareQuote, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'

const emptyForm = { name: '', location: '', rating: 5, text: '' }

const Stars = ({ rating }) => (
  <span className="review-stars">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={14} strokeWidth={n <= rating ? 0 : 1.6} fill={n <= rating ? 'currentColor' : 'none'} />
    ))}
  </span>
)

export default function Testimonials() {
  const { testimonials, addTestimonial, updateTestimonial, deleteTestimonial } = useData()
  const { toast } = useToast()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const openCreate = () => {
    setForm(emptyForm)
    setError('')
    setEditing('new')
  }

  const openEdit = (t) => {
    setForm({ name: t.name, location: t.location || '', rating: t.rating, text: t.text })
    setError('')
    setEditing(t)
  }

  const save = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.text.trim()) {
      setError('Customer name and review text are required.')
      return
    }
    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      rating: Math.min(5, Math.max(1, Number(form.rating) || 5)),
      text: form.text.trim(),
    }
    if (editing === 'new') {
      addTestimonial(payload)
      toast('Review added')
    } else {
      updateTestimonial(editing.id, payload)
      toast('Review updated')
    }
    setEditing(null)
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Reviews</h1>
          <p>Testimonials shown on the home page.</p>
        </div>
        <button type="button" className="btn btn-gold" onClick={openCreate}>
          <Plus size={16} /> Add review
        </button>
      </header>

      {testimonials.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="No reviews yet"
          text="Add a review and it will appear in the Testimonials section of the home page."
          action={
            <button type="button" className="btn btn-gold" onClick={openCreate}>
              <Plus size={16} /> Add review
            </button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Location</th>
                <th>Rating</th>
                <th>Review</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td>{t.location || '—'}</td>
                  <td><Stars rating={t.rating} /></td>
                  <td className="muted review-text">{t.text}</td>
                  <td className="right">
                    <button type="button" className="btn-icon" title="Edit" onClick={() => openEdit(t)}>
                      <Pencil size={15} />
                    </button>
                    <button type="button" className="btn-icon danger" title="Delete" onClick={() => setDeleting(t)}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Add review' : 'Edit review'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" form="review-form" className="btn btn-gold">
              {editing === 'new' ? 'Add review' : 'Save changes'}
            </button>
          </>
        }
      >
        <form id="review-form" className="form-grid" onSubmit={save} noValidate>
          <div className="field">
            <label>Customer name</label>
            <input className="input" value={form.name} onChange={set('name')} placeholder="Maria G." />
          </div>
          <div className="field">
            <label>Location (optional)</label>
            <input className="input" value={form.location} onChange={set('location')} placeholder="Freeport, Cruise visitor…" />
          </div>
          <div className="field">
            <label>Rating</label>
            <select className="select" value={form.rating} onChange={set('rating')}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div className="field span-2">
            <label>Review text</label>
            <textarea className="textarea" value={form.text} onChange={set('text')} placeholder="What the customer said about the rental." />
          </div>
          {error && <span className="form-error span-2">{error}</span>}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete review"
        message={deleting ? `Remove the review from ${deleting.name}? This can't be undone.` : ''}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          deleteTestimonial(deleting.id)
          toast('Review deleted')
          setDeleting(null)
        }}
      />
    </>
  )
}
