export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">
      {Icon && <Icon size={36} strokeWidth={1.4} />}
      <h4>{title}</h4>
      {text && <p>{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
