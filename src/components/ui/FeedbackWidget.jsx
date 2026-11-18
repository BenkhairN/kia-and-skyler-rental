import { useState } from 'react'
import { MessageSquareText, Send, Star, X } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'

export default function FeedbackWidget() {
  const { addMessage } = useData()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!message.trim()) {
      toast('Please write a short message', 'error')
      return
    }
    try {
      await addMessage({
        name: name.trim() || 'Website visitor',
        rating,
        message: message.trim(),
      })
    } catch {
      toast('Could not send feedback. Please try again.', 'error')
      return
    }
    toast('Thanks for your feedback!', 'success')
    setOpen(false)
    setRating(0)
    setName('')
    setMessage('')
  }

  return (
    <div className="feedback-widget">
      {open && (
        <form className="feedback-panel card" onSubmit={submit} noValidate>
          <div className="feedback-head">
            <strong>Share your feedback</strong>
            <button type="button" className="btn-icon" onClick={() => setOpen(false)} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <div className="feedback-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`feedback-star ${n <= rating ? 'on' : ''}`}
                onClick={() => setRating(n === rating ? 0 : n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star size={20} strokeWidth={n <= rating ? 0 : 1.6} fill={n <= rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <input
            className="input"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className="textarea"
            placeholder="How was your experience?"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="submit" className="btn btn-gold">
            <Send size={15} />
            Send feedback
          </button>
        </form>
      )}
      <button
        type="button"
        className="feedback-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close feedback' : 'Leave feedback'}
      >
        {open ? <X size={20} /> : <MessageSquareText size={20} />}
      </button>
    </div>
  )
}
