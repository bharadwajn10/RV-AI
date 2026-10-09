import { Link } from 'react-router-dom'

function QuickActionCard({ icon, title, description, to }) {
  return (
    <Link className="content-card quick-action-card" to={to}>
      <span aria-hidden="true" className="quick-action-icon">{icon}</span>
      <span aria-hidden="true" className="quick-action-arrow">↗</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </Link>
  )
}

export default QuickActionCard
