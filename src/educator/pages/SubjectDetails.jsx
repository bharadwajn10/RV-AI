import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProgressBar from '../components/ProgressBar.jsx'
import TopicCard from '../components/TopicCard.jsx'
import { useCourses } from '../context/useCourses.js'
import { subjectTopics } from '../data/mockData.js'
import './SubjectDetails.css'

const tabs = [
  { id: 'concepts', label: 'Concepts', icon: '◇' },
  { id: 'flashcards', label: 'Flashcards', icon: '▤' },
  { id: 'exam-prep', label: 'Exam Prep', icon: '◎' },
  { id: 'progress', label: 'Progress', icon: '⌁' },
]

function SubjectOverview({ subject, topics }) {
  const remainingTopics = topics.filter((topic) => topic.status !== 'completed')
  const remainingMinutes = remainingTopics.reduce((total, topic) => {
    const [, hours = '0', minutes = '0'] =
      topic.estimatedTime.match(/(?:(\d+)\s*hr\s*)?(?:(\d+)\s*min)?/) || []
    return total + Number(hours) * 60 + Number(minutes)
  }, 0)
  const remainingTime = remainingMinutes >= 60
    ? `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m`
    : `${remainingMinutes} min`

  return (
    <section aria-label={`${subject.name} overview`} className="subject-overview-card">
      <div className="subject-overview-top">
        <div className="subject-detail-identity">
          <span aria-hidden="true" className="subject-detail-icon">{subject.icon}</span>
          <div>
            <span className="subject-detail-kicker">{subject.category} SUBJECT</span>
            <h1>{subject.name}</h1>
            <p>{subject.description}</p>
          </div>
        </div>
        <Link className="subject-back-link" to="/subjects">
          <span aria-hidden="true">←</span> All subjects
        </Link>
      </div>
      <div className="subject-overview-bottom">
        <div className="subject-overall-progress">
          <ProgressBar label="Overall progress" value={subject.progress} />
        </div>
        <div className="subject-overview-stat">
          <strong>{subject.progress}%</strong>
          <span>Overall progress</span>
        </div>
        <div className="subject-overview-stat">
          <strong>{subject.topicsCompleted}<span>/{subject.totalTopics}</span></strong>
          <span>Topics completed</span>
        </div>
        <div className="subject-overview-stat">
          <strong>{remainingTime}</strong>
          <span>Estimated remaining</span>
        </div>
      </div>
    </section>
  )
}

function ConceptsPanel({ topics, subject, onEnroll, onStart }) {
  const currentTopic = topics.find((topic) => topic.status === 'in-progress')
  const continueTarget = subject.id === 'data-structures'
    ? '/learn/data-structures/binary-trees'
    : `/learn/${subject.id}/${currentTopic?.id || topics[0]?.id || ''}`

  return (
    <section aria-labelledby="concepts-heading" className="subject-tab-panel">
      <div className="concepts-panel-heading">
        <div>
          <h2 id="concepts-heading">Concepts</h2>
          <p>Work through the key topics in {subject.name}.</p>
        </div>
        {!subject.enrolled ? (
          <button className="subject-enroll-button" onClick={onEnroll} type="button">
            <span aria-hidden="true">＋</span> Enroll in Course
          </button>
        ) : (
          <Link
            className="subject-continue-button"
            onClick={() => {
              if (subject.progress === 0) onStart()
            }}
            to={continueTarget}
          >
            {subject.progress === 0 ? 'Start Learning' : 'Continue Learning'}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
      <div className="topic-list">
        {topics.map((topic) => <TopicCard key={topic.id} topic={topic} />)}
      </div>
    </section>
  )
}

function EmptyTabPanel({ tab }) {
  return (
    <section aria-live="polite" className="subject-tab-empty">
      <span aria-hidden="true" className="subject-tab-empty-icon">{tab.icon}</span>
      <h2>{tab.label}</h2>
      <p>This area is ready for your {tab.label.toLowerCase()} learning tools.</p>
      <span className="subject-tab-coming-soon">Learning materials will appear here</span>
    </section>
  )
}

function ProgressPanel({ subject, topics }) {
  const completedCount = topics.filter((topic) => topic.status === 'completed').length
  const inProgressCount = topics.filter((topic) => topic.status === 'in-progress').length
  const remainingCount = topics.length - completedCount - inProgressCount

  return (
    <section aria-labelledby="subject-progress-heading" className="subject-tab-panel subject-progress-panel">
      <div className="concepts-panel-heading">
        <div>
          <h2 id="subject-progress-heading">Your progress</h2>
          <p>A snapshot of your progress in {subject.name}.</p>
        </div>
      </div>
      <div className="subject-progress-summary">
        <div className="subject-progress-highlight">
          <span className="subject-progress-percent">{subject.progress}%</span>
          <span>overall progress</span>
          <ProgressBar value={subject.progress} />
        </div>
        <div className="subject-progress-counts">
          <div><strong>{subject.topicsCompleted}</strong><span>Topics completed</span></div>
          <div><strong>{completedCount}</strong><span>Topics shown completed</span></div>
          <div><strong>{inProgressCount}</strong><span>In progress</span></div>
          <div><strong>{remainingCount}</strong><span>Not started</span></div>
        </div>
      </div>
    </section>
  )
}

function SubjectDetails() {
  const { subjectId } = useParams()
  const [activeTab, setActiveTab] = useState('concepts')
  const { courses, enrollCourse, startCourse, error } = useCourses()
  const subject = courses.find((item) => item.id === subjectId)
  const topics = subjectTopics[subjectId] || []
  const handleEnroll = () => enrollCourse(subjectId)
  const handleStart = () => startCourse(subjectId)

  if (!subject || topics.length === 0) {
    return (
      <div className="subject-not-found">
        <span aria-hidden="true">⌕</span>
        <h1>Subject not found</h1>
        <p>Choose a subject from your library to view its learning overview.</p>
        <Link className="subject-continue-button" to="/subjects">Browse subjects</Link>
      </div>
    )
  }

  const activeTabDetails = tabs.find((tab) => tab.id === activeTab)

  return (
    <div className="subject-details-page">
      {error && <p aria-live="polite" className="course-storage-error">{error}</p>}
      <SubjectOverview subject={subject} topics={topics} />

      <div aria-label="Subject learning sections" className="subject-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            aria-controls={`subject-panel-${tab.id}`}
            aria-selected={activeTab === tab.id}
            className={`subject-tab${activeTab === tab.id ? ' is-active' : ''}`}
            id={`subject-tab-${tab.id}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`subject-tab-${activeTab}`}
        className="subject-tab-content"
        id={`subject-panel-${activeTab}`}
        role="tabpanel"
        tabIndex="0"
      >
        {activeTab === 'concepts' && (
          <ConceptsPanel
            onEnroll={handleEnroll}
            onStart={handleStart}
            subject={subject}
            topics={topics}
          />
        )}
        {activeTab === 'progress' && <ProgressPanel subject={subject} topics={topics} />}
        {activeTab !== 'concepts' && activeTab !== 'progress' && (
          <EmptyTabPanel tab={activeTabDetails} />
        )}
      </div>
    </div>
  )
}

export default SubjectDetails
