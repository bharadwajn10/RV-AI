import ProgressBar from './ProgressBar.jsx'

const statusLabels = {
  completed: 'Completed',
  'in-progress': 'In progress',
  'not-started': 'Not started',
}

const statusIcons = {
  completed: '✓',
  'in-progress': '◐',
  'not-started': '○',
}

function TopicCard({ topic }) {
  return (
    <article className={`topic-card topic-card-${topic.status}`} id={`topic-${topic.id}`}>
      <span
        aria-label={statusLabels[topic.status]}
        className={`topic-status topic-status-${topic.status}`}
        role="img"
      >
        {statusIcons[topic.status]}
      </span>
      <div className="topic-card-main">
        <div className="topic-card-heading">
          <h3>{topic.name}</h3>
          <span className={`topic-status-label topic-label-${topic.status}`}>
            {statusLabels[topic.status]}
          </span>
        </div>
        <div className="topic-card-meta">
          <span>{topic.difficulty}</span>
          <span aria-hidden="true" className="topic-meta-dot">·</span>
          <span>{topic.estimatedTime}</span>
        </div>
        <ProgressBar label="Topic progress" value={topic.progress} />
      </div>
    </article>
  )
}

export default TopicCard
