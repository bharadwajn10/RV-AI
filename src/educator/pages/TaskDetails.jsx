import { Link, useParams } from 'react-router-dom'
import { useTasks } from '../context/useTasks.js'
import './TaskDetails.css'

const taskIcons = {
  Assignment: '📝',
  Test: '📋',
  Exam: '🎓',
  Assessment: '🎯',
  Quiz: '❓',
  Project: '💻',
  Lab: '🔬',
  Presentation: '📊',
  'Personal Task': '📚',
  Study: '📚',
  Revision: '📖',
  Other: '📌',
}

const taskActions = {
  Assignment: 'Open Assignment',
  Test: 'View Test',
  Exam: 'View Exam',
  Assessment: 'Open Assessment',
  Quiz: 'Open Quiz',
  Project: 'View Project',
  Lab: 'View Lab',
  Presentation: 'View Presentation',
  'Personal Task': 'Open Task',
  Study: 'Open Study Task',
  Revision: 'Open Revision Task',
  Other: 'Open Task',
}

function TaskDetails() {
  const { taskId } = useParams()
  const { tasks } = useTasks()
  const task = tasks.find((item) => item.id === taskId)

  if (!task) {
    return (
      <div className="task-not-found">
        <span aria-hidden="true">⌕</span>
        <h1>Task not found</h1>
        <p>This task may have been removed or the link is no longer valid.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    )
  }

  const deadline = new Date(task.deadline)
  const readableDeadline = Number.isNaN(deadline.getTime())
    ? 'Deadline unavailable'
    : deadline.toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })

  return (
    <div className="task-details-page">
      <Link className="task-details-back" to="/dashboard">
        <span aria-hidden="true">←</span> Back to Dashboard
      </Link>
      <article className="task-details-card">
        <div className="task-details-topline">
          <span aria-hidden="true" className="task-details-icon">{taskIcons[task.type] || '📚'}</span>
          <div>
            <span className="task-details-type">{task.type}</span>
            {task.source === 'student' && <span className="task-details-source">MY TASK</span>}
          </div>
          <span className={`task-details-status${task.status === 'completed' ? ' is-complete' : ''}`}>
            {task.status === 'completed' ? 'Completed' : 'Pending'}
          </span>
        </div>
        <h1>{task.title}</h1>
        <p className="task-details-subject">{task.subject || 'General'}</p>

        <div className="task-details-facts">
          <div>
            <span>DEADLINE</span>
            <strong>{readableDeadline}</strong>
          </div>
          <div>
            <span>{task.source === 'faculty' ? 'INSTRUCTOR' : 'CREATED BY'}</span>
            <strong>{task.faculty || 'You'}</strong>
          </div>
        </div>

        <section className="task-details-section">
          <h2>Description</h2>
          <p>{task.description || 'No additional description provided.'}</p>
        </section>
        <section className="task-details-section">
          <h2>Instructions</h2>
          <p>{task.instructions || 'Review the task details and complete it before the deadline.'}</p>
        </section>
        <Link
          className="task-details-action"
          to={task.subjectId ? `/subjects/${task.subjectId}` : '/dashboard'}
        >
          {taskActions[task.type] || 'Open Task'} <span aria-hidden="true">→</span>
        </Link>
      </article>
    </div>
  )
}

export default TaskDetails
