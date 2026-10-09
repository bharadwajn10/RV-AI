import { Link } from 'react-router-dom'
import ProgressBar from './ProgressBar.jsx'

function SubjectCard({ subject, badge, onEnroll, onStart }) {
  const isCompleted = subject.progress === 100
  const isStarted = subject.progress > 0

  return (
    <article className="subject-library-card">
      <div className="subject-library-heading">
        <span aria-hidden="true" className="subject-library-icon">
          {subject.icon}
        </span>
        <span className="subject-category">{subject.category}</span>
        {badge && <span className="subject-badge">{badge}</span>}
      </div>
      <h3 className="subject-library-title">
        <Link to={`/subjects/${subject.id}`}>{subject.name}</Link>
      </h3>
      <p className="subject-library-description">{subject.description}</p>
      <div className="subject-library-progress">
        <ProgressBar label="Progress" value={subject.progress} />
      </div>
      <div className="subject-library-meta">
        <span>{subject.topicsCompleted} of {subject.totalTopics} topics completed</span>
        <span>{subject.progress}%</span>
      </div>
      <div className="subject-last-studied">
        <span className="subject-last-label">{isStarted ? 'LAST STUDIED' : 'COURSE STATUS'}</span>
        <span className="subject-last-topic">
          {isStarted ? subject.lastStudiedTopic : subject.enrolled ? 'Enrolled — ready when you are' : 'Not enrolled yet'}
        </span>
        <span className="subject-last-time">{isStarted ? subject.lastStudied : ''}</span>
      </div>
      <div className="subject-card-actions">
        {!subject.enrolled && (
          <button className="subject-enroll-button" onClick={onEnroll} type="button">
            <span aria-hidden="true">＋</span> Enroll in Course
          </button>
        )}
        {subject.enrolled && !isStarted && (
          <>
            <span className="subject-enrolled-state"><span aria-hidden="true">✓</span> Enrolled</span>
            <button className="subject-continue-button" onClick={onStart} type="button">
              Start Learning <span aria-hidden="true">→</span>
            </button>
          </>
        )}
        {isStarted && !isCompleted && (
          <Link className="subject-continue-button" to={`/subjects/${subject.id}`}>
            Continue Learning <span aria-hidden="true">→</span>
          </Link>
        )}
        {isCompleted && (
          <span aria-label="Course completed" className="subject-completed-state">
            <span aria-hidden="true">✓</span> Completed
          </span>
        )}
      </div>
    </article>
  )
}

export default SubjectCard
