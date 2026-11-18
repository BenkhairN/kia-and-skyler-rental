import { useState } from 'react'
import { Inbox, Star, Trash2 } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/format'

const sentAt = (value) => value?.includes('T')
  ? new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  : formatDate(value)

export default function Feedback() {
  const { messages, updateMessage, deleteMessage } = useData()
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(null)
  const [openId, setOpenId] = useState(null)

  const viewing = messages.find((m) => m.id === openId)
  const open = (m) => {
    setOpenId(m.id)
    if (!m.read) updateMessage(m.id, { read: true })
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Feedback</h1>
          <p>{messages.length} submission{messages.length !== 1 ? 's' : ''}</p>
        </div>
      </header>

      {messages.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No feedback yet"
          text="Feedback from website visitors will appear here."
        />
      ) : (
        <div className="msg-list">
          {messages.map((m) => (
            <article key={m.id} className={`msg-item card ${m.read ? '' : 'unread'}`}>
              <button
                type="button"
                className="msg-head"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 10, width: '100%' }}
                onClick={() => open(m)}
                aria-haspopup="dialog"
              >
                <span className="flex items-center justify-between gap-3 wrap">
                  <span className="flex items-center gap-3">
                  <strong>{m.name}</strong>
                  {m.rating > 0 && (
                    <span className="msg-stars" aria-label={`${m.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={13} strokeWidth={n <= m.rating ? 0 : 1.6} fill={n <= m.rating ? 'currentColor' : 'none'} />
                      ))}
                    </span>
                  )}
                  </span>
                  <span className="muted small">{sentAt(m.createdAt)}</span>
                </span>
                <span className="msg-preview" style={{ display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontWeight: m.read ? 400 : 700, color: m.read ? undefined : 'var(--text)' }}>{m.message}</span>
              </button>
            </article>
          ))}
        </div>
      )}

      <Modal open={Boolean(viewing)} title="Feedback details" onClose={() => setOpenId(null)} size={560}
        footer={viewing && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setDeleting(viewing); setOpenId(null) }}>
            <Trash2 size={15} /> Delete
          </button>
        )}>
        {viewing && (
          <div>
            <div className="flex items-center justify-between gap-3 wrap">
              <strong>Name: {viewing.name}</strong>
              <span className="muted small">{sentAt(viewing.createdAt)}</span>
            </div>
            {viewing.rating > 0 && (
              <div className="msg-stars mt-2" aria-label={`${viewing.rating} out of 5 stars`}>
                <span className="muted small">Rating: </span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={16} strokeWidth={n <= viewing.rating ? 0 : 1.6} fill={n <= viewing.rating ? 'currentColor' : 'none'} />
                ))}
              </div>
            )}
            {viewing.email && <p className="muted small mt-2">Email: {viewing.email}</p>}
            {viewing.phone && <p className="muted small mt-2">Phone: {viewing.phone}</p>}
            <p className="mt-4" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>Feedback: {viewing.message}</p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete feedback"
        message={deleting ? `Delete the feedback from ${deleting.name}?` : ''}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          deleteMessage(deleting.id)
          toast('Feedback deleted')
          setDeleting(null)
        }}
      />
    </>
  )
}
