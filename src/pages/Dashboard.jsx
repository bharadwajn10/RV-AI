import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import QuickActionCard from '../components/QuickActionCard.jsx'
import { useState } from 'react'
import { useCourses } from '../context/useCourses.js'
import { useTasks } from '../context/useTasks.js'
import { dashboardData, learningModes, quickActions } from '../data/mockData.js'
import './Dashboard.css'

function SubjectsSummary({ subjects: allSubjects }) {
  const startedSubjects = allSubjects.filter((subject) => subject.progress > 0)
  const { error } = useCourses()

  return (
    <section aria-labelledby="your-subjects-title" className="dashboard-panel dashboard-subjects-panel">
      <div className="subjects-summary-heading">
        <h2 id="your-subjects-title">Your Subjects</h2>
        <Link className="subjects-view-all" to="/subjects">
          View All Subjects <span aria-hidden="true">→</span>
        </Link>
      </div>
      {error && <p aria-live="polite" className="course-storage-error">{error}</p>}
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
            {subject.currentTopic && (
              <span className="dashboard-subject-topic">{subject.currentTopic}</span>
            )}
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

function AddTaskDialog({ onClose, onSubmit }) {
  const { courses } = useCourses()

  function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    onSubmit({
      title: String(formData.get('title')).trim(),
      type: String(formData.get('type')),
      subject: String(formData.get('subject')),
      deadline: String(formData.get('deadline')),
      description: String(formData.get('description')).trim(),
    })
    onClose()
  }

  return (
    <div
      className="add-task-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <section
        aria-labelledby="add-task-title"
        aria-modal="true"
        className="add-task-dialog"
        role="dialog"
      >
        <div className="add-task-dialog-heading">
          <div>
            <span className="panel-eyebrow">PERSONAL REMINDER</span>
            <h2 id="add-task-title">Add Task</h2>
          </div>
          <button aria-label="Close Add Task" className="add-task-close" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <form className="add-task-form" onSubmit={handleSubmit}>
          <label>
            Task title <span aria-hidden="true">*</span>
            <input autoFocus maxLength="120" name="title" placeholder="e.g. Revise Binary Trees" required />
          </label>
          <div className="add-task-form-row">
            <label>
              Task type
              <select defaultValue="Personal Task" name="type">
                {['Personal Task', 'Assignment', 'Study', 'Revision', 'Project', 'Other'].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label>
              Subject
              <select defaultValue="" name="subject">
                <option value="">General</option>
                {courses.map((course) => <option key={course.id}>{course.name}</option>)}
              </select>
            </label>
          </div>
          <label>
            Deadline <span aria-hidden="true">*</span>
            <input name="deadline" required type="datetime-local" />
          </label>
          <label>
            Description <span className="add-task-optional">(optional)</span>
            <textarea maxLength="500" name="description" placeholder="Add any helpful details" rows="3" />
          </label>
          <div className="add-task-actions">
            <button className="add-task-cancel" onClick={onClose} type="button">Cancel</button>
            <button className="add-task-submit" type="submit">Add Task</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function DueTasks({ tasks }) {
  const [showAll, setShowAll] = useState(false)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const { addTask, completeTask, error } = useTasks()
  const now = new Date()
  const pendingTasks = tasks
    .filter((task) => task.status === 'pending')
    .sort((first, second) => new Date(first.deadline).getTime() - new Date(second.deadline).getTime())
  const visibleTasks = showAll ? pendingTasks : pendingTasks.slice(0, 3)

  return (
    <section aria-labelledby="due-tasks-title" className="dashboard-panel today-panel due-tasks-panel">
      <div className="panel-heading">
        <div>
          <h2 id="due-tasks-title">Due Tasks</h2>
          <p className="due-tasks-subtitle">Stay on top of your upcoming deadlines.</p>
        </div>
        <div className="due-tasks-header-actions">
          <button className="due-tasks-add" onClick={() => setIsAddTaskOpen(true)} type="button">
            + Add Task
          </button>
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
      {error && <p aria-live="polite" className="task-storage-error">{error}</p>}
      {pendingTasks.length === 0 ? (
        <div className="due-tasks-empty">
          <strong>You&apos;re all caught up! 🎉</strong>
          <span>No upcoming deadlines.</span>
        </div>
      ) : (
        <div className="due-tasks-list">
          {visibleTasks.map((task) => {
            const deadline = getDeadlineState(task.deadline, now)
            return (
              <article className={`due-task-row due-task-${deadline.tone}`} key={task.id}>
                <Link
                  aria-label={`${task.type}: ${task.title}, ${task.subject || 'General'}, ${deadline.label}`}
                  className="due-task-link"
                  to={task.destination || `/tasks/${task.id}`}
                >
                  <span aria-hidden="true" className={`due-task-type-icon due-task-icon-${task.type.toLowerCase().replaceAll(' ', '-')}`}>
                    {taskTypeIcons[task.type] || '📚'}
                  </span>
                  <div className="due-task-copy">
                    <div className="due-task-title-row">
                      <span className="due-task-type">{task.type}</span>
                      {task.source === 'student' && <span className="due-task-source">MY TASK</span>}
                      <span className="due-task-deadline">{deadline.label}</span>
                    </div>
                    <strong className="due-task-title">{task.title}</strong>
                    <span className="due-task-subject">{task.subject || 'General'}</span>
                  </div>
                </Link>
                {task.source === 'student' && (
                  <button
                    aria-label={`Mark ${task.title} complete`}
                    className="due-task-complete"
                    onClick={() => completeTask(task.id)}
                    type="button"
                  >
                    ✓ <span>Complete</span>
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}
      {isAddTaskOpen && (
        <AddTaskDialog onClose={() => setIsAddTaskOpen(false)} onSubmit={addTask} />
      )}
    </section>
  )
}

function LearningModeCard({ mode }) {
  return (
    <article className={`learning-mode-card mode-${mode.className}`}>
      <span aria-hidden="true" className="mode-icon">{mode.icon}</span>
      <h3>{mode.title}</h3>
      <p>{mode.description}</p>
      <Link className="mode-action" to={mode.to}>
        {mode.action} <span aria-hidden="true">→</span>
      </Link>
    </article>
  )
}

function Dashboard() {
  const { studentName } = dashboardData
  const { getStartedCourses } = useCourses()
  const { getPendingTasks } = useTasks()
  const visibleLearningModes = learningModes.filter((mode) => mode.className !== 'apply')

  return (
    <div className="dashboard-page">
      <PageHeader
        description="A little progress each day adds up. Let’s make today count."
        title={`Good morning, ${studentName}`}
      />

      <div className="dashboard-overview">
        <SubjectsSummary subjects={getStartedCourses()} />
        <DueTasks tasks={getPendingTasks()} />
      </div>

      <section aria-labelledby="quick-actions-title" className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2 id="quick-actions-title">Quick Actions</h2>
            <p>Jump straight into your next study session.</p>
          </div>
        </div>
        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            <QuickActionCard key={action.title} {...action} />
          ))}
        </div>
      </section>

      <section aria-labelledby="learning-modes-title" className="dashboard-section modes-section">
        <div className="section-heading">
          <div>
            <h2 id="learning-modes-title">Learning Modes</h2>
            <p>Choose how you want to learn today.</p>
          </div>
        </div>
        <div className="learning-modes-grid">
          {visibleLearningModes.map((mode) => (
            <LearningModeCard key={mode.title} mode={mode} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
