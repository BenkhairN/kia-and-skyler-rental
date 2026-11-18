export default function StatCard({ icon: Icon, label, value, hint, tone = 'blue' }) {
  return (
    <div className={`stat-card stat-${tone} card`}>
      <div className="stat-icon">{Icon && <Icon size={22} />}</div>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        {hint && <span className="stat-hint">{hint}</span>}
      </div>
    </div>
  )
}
