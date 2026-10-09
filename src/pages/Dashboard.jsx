import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import QuickActionCard from '../components/QuickActionCard.jsx'
import { useState, useEffect } from 'react'
import { fetchLearnerDashboard, loginLearner } from '../api.js'
import './Dashboard.css'

function SubjectsSummary({ subjects }) {
  const startedSubjects = subjects || []
  return (
    <section aria-labelledby="your-subjects-title" className="dashboard-panel dashboard-subjects-panel">
      <div className="subjects-summary-heading">
        <h2 id="your-subjects-title">Your Subjects</h2>
        <Link className="subjects-view-all" to="/subjects">
          View All Subjects <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="dashboard-subjects-grid">
        {startedSubjects.map((subject) => (
          <Link
            aria-label={`${subject.name}, ${subject.progress}% complete`}
            className="dashboard-subject-card"
            key={subject.id}
            to={`/subjects/${subject.id}`}
          >
            <div className="dashboard-subject-card-heading">
              <strong className="dashboard-subject-name">{subject.name}</strong>
              <span className="dashboard-subject-percentage">{subject.progress}%</span>
            </div>
            <div
              aria-label={`${subject.name} progress`}
              aria-valuemax="100"
              aria-valuemin="0"
              aria-valuenow={subject.progress}
              className="dashboard-subject-progress"
              role="progressbar"
            >
              <span style={{ width: `${subject.progress}%` }} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

const taskTypeIcons = {
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

function getDeadlineState(deadline, now) {
  if (!deadline) return { label: 'No date', tone: 'upcoming' }
  const dueAt = new Date(deadline)
  if (dueAt < now) return { label: 'OVERDUE', tone: 'overdue' }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(dueAt.getFullYear(), dueAt.getMonth(), dueAt.getDate())
  const dayDifference = Math.round((dueDay - today) / 86400000)

  if (dayDifference === 0) return { label: 'Due today', tone: 'today' }
  if (dayDifference === 1) return { label: 'Tomorrow', tone: 'tomorrow' }

  return {
    label: dueAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    tone: 'upcoming',
  }
}

function DueTasks({ tasks }) {
  const [showAll, setShowAll] = useState(false)
  const now = new Date()
  const pendingTasks = (tasks || [])
    .filter((task) => task.status !== 'completed')
  const visibleTasks = showAll ? pendingTasks : pendingTasks.slice(0, 3)

  return (
    <section aria-labelledby="due-tasks-title" className="dashboard-panel today-panel due-tasks-panel">
      <div className="panel-heading">
        <div>
          <h2 id="due-tasks-title">Due Tasks</h2>
          <p className="due-tasks-subtitle">Stay on top of your upcoming deadlines.</p>
        </div>
        <div className="due-tasks-header-actions">
          <button
            aria-expanded={showAll}
            className="due-tasks-view-all"
            onClick={() => setShowAll((isShowingAll) => !isShowingAll)}
            type="button"
          >
            {showAll ? 'Show less ↑' : 'View All →'}
          </button>
        </div>
      </div>
      {pendingTasks.length === 0 ? (
        <div className="due-tasks-empty">
          <strong>You&apos;re all caught up! 🎉</strong>
          <span>No upcoming deadlines.</span>
        </div>
      ) : (
        <div className="due-tasks-list">
          {visibleTasks.map((task) => {
            const deadline = getDeadlineState(task.due_at, now)
            return (
              <article className={`due-task-row due-task-${deadline.tone}`} key={task.id}>
                <Link
                  aria-label={`${task.type}: ${task.title}, ${task.subject_name || 'General'}, ${deadline.label}`}
                  className="due-task-link"
                  to={`/tasks/${task.id}`}
                >
                  <span aria-hidden="true" className={`due-task-type-icon due-task-icon-${(task.type || 'study').toLowerCase().replaceAll(' ', '-')}`}>
                    {taskTypeIcons[task.type] || '📚'}
                  </span>
                  <div className="due-task-copy">
                    <div className="due-task-title-row">
                      <span className="due-task-type">{task.type}</span>
                      <span className="due-task-deadline">{deadline.label}</span>
                    </div>
                    <strong className="due-task-title">{task.title}</strong>
                    <span className="due-task-subject">{task.subject_name || 'General'}</span>
                  </div>
                </Link>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function LearningModeCard({ mode }) {
  return (
    <article className={`learning-mode-card mode-${mode.id}`}>
      <span aria-hidden="true" className="mode-icon">📚</span>
      <h3>{mode.title}</h3>
      <p>{mode.subtitle}</p>
      <Link className="mode-action" to={mode.route}>
        Start <span aria-hidden="true">→</span>
      </Link>
    </article>
  )
}

function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    async function init() {
      try {
        if (!localStorage.getItem('token')) {
          await loginLearner()
        }
        const dashboard = await fetchLearnerDashboard()
        setData(dashboard)
      } catch (err) {
        setError(err.message)
      }
    }
    init()
  }, [])

  if (error) return <div className="dashboard-page">Error loading dashboard: {error}</div>
  if (!data) return <div className="dashboard-page">Loading...</div>

  return (
    <div className="dashboard-page">
      <PageHeader
        description="A little progress each day adds up. Let’s make today count."
        title={`Good morning, ${data.user.name}`}
      />

      <div className="dashboard-overview">
        <SubjectsSummary subjects={data.subjects} />
        <DueTasks tasks={data.due_tasks} />
      </div>

      {data.learning_modes?.length > 0 && (
        <section aria-labelledby="learning-modes-title" className="dashboard-section modes-section">
          <div className="section-heading">
            <div>
              <h2 id="learning-modes-title">Learning Modes</h2>
              <p>Choose how you want to learn today.</p>
            </div>
          </div>
          <div className="learning-modes-grid">
            {data.learning_modes.map((mode) => (
              <LearningModeCard key={mode.id} mode={mode} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Dashboard
