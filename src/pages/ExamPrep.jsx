import { useState } from 'react'
import { Link } from 'react-router-dom'
import { examPrepData } from '../data/mockData.js'
import './ExamPrep.css'

function PracticeTestCard({ test, onStart }) {
  return (
    <section aria-labelledby="practice-test-heading" className="exam-test-card">
      <div className="exam-test-card-copy">
        <span className="exam-kicker"><span aria-hidden="true">◈</span> MOCK EXAM</span>
        <h2 id="practice-test-heading">Practice Test</h2>
        <p>Put your knowledge to the test in a timed, exam-style session.</p>
        <div className="exam-test-facts">
          <span><strong>{test.questions}</strong> questions</span>
          <i />
          <span><strong>{test.duration}</strong> minutes</span>
          <i />
          <span>{test.difficulty}</span>
        </div>
        <button className="exam-primary-button" onClick={onStart} type="button">
          Start Test <span aria-hidden="true">→</span>
        </button>
      </div>
      <div aria-hidden="true" className="exam-test-art">
        <span className="exam-art-ring exam-art-ring-outer" />
        <span className="exam-art-ring exam-art-ring-inner" />
        <span className="exam-paper">
          <i /><i /><i />
          <b>✓</b>
        </span>
        <span className="exam-art-spark exam-art-spark-one">✦</span>
        <span className="exam-art-spark exam-art-spark-two">+</span>
        <span className="exam-art-badge">45:00</span>
      </div>
    </section>
  )
}

function ReadinessCard({ score }) {
  return (
    <section aria-labelledby="readiness-heading" className="readiness-card">
      <div className="readiness-heading">
        <span className="exam-kicker">YOUR CURRENT OUTLOOK</span>
        <span aria-hidden="true" className="readiness-trend">↗</span>
      </div>
      <h2 id="readiness-heading">Exam readiness</h2>
      <div className="readiness-score-layout">
        <div
          aria-label={`Exam readiness ${score}%`}
          className="readiness-gauge"
          role="img"
          style={{ '--readiness-score': `${score * 3.6}deg` }}
        >
          <div>
            <strong>{score}<span>%</span></strong>
            <small>READY</small>
          </div>
        </div>
        <p>You’re building a solid base. Focus your next revision session on the topics that need a little more practice.</p>
      </div>
      <div className="readiness-footnote">
        <span aria-hidden="true">●</span> Based on your recent practice
      </div>
    </section>
  )
}

function WeakTopics({ topics }) {
  return (
    <section aria-labelledby="weak-topics-heading" className="exam-panel weak-topics-panel">
      <div className="exam-panel-heading">
        <div>
          <span className="exam-kicker">WHERE TO FOCUS</span>
          <h2 id="weak-topics-heading">Topic accuracy</h2>
        </div>
        <span className="weak-flag"><span aria-hidden="true">↘</span> Needs attention</span>
      </div>
      <div className="weak-topics-list">
        {topics.map((topic) => {
          const isWeak = topic.accuracy < 60
          return (
            <Link
              className={`weak-topic-row${isWeak ? ' is-weak' : ''}`}
              key={topic.name}
              to={`/learn/data-structures/${topic.name.toLowerCase().replaceAll(' ', '-')}`}
            >
              <span className="weak-topic-name">{topic.name}</span>
              <span className="weak-topic-track">
                <span style={{ width: `${topic.accuracy}%` }} />
              </span>
              <strong>{topic.accuracy}%</strong>
              {isWeak && <span className="weak-topic-label">Review</span>}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function RevisionCard({ item, isExpanded, onToggle }) {
  return (
    <article className={`revision-card${isExpanded ? ' is-expanded' : ''}`}>
      <button
        aria-expanded={isExpanded}
        className="revision-card-button"
        onClick={onToggle}
        type="button"
      >
        <span className="revision-icon">{item.icon}</span>
        <span className="revision-card-copy">
          <strong>{item.title}</strong>
          <small>{item.description}</small>
        </span>
        <span aria-hidden="true" className="revision-chevron">{isExpanded ? '−' : '+'}</span>
      </button>
      {isExpanded && (
        <div className="revision-card-detail">
          <p>{item.detail}</p>
          <Link to="/flashcards">Review now <span aria-hidden="true">→</span></Link>
        </div>
      )}
    </article>
  )
}

function TestSetupDialog({ test, onClose }) {
  return (
    <div
      aria-labelledby="exam-dialog-title"
      aria-modal="true"
      className="exam-dialog-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="dialog"
    >
      <section className="exam-dialog">
        <button
          aria-label="Close test details"
          className="exam-dialog-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <span aria-hidden="true" className="exam-dialog-icon">◈</span>
        <span className="exam-kicker">PRACTICE SESSION</span>
        <h2 id="exam-dialog-title">You’re set for exam practice</h2>
        <p>Take your time, read each question carefully, and use this as a chance to spot what to revise next.</p>
        <div className="exam-dialog-summary">
          <span><strong>{test.questions}</strong> questions</span>
          <span><strong>{test.duration} min</strong> estimated</span>
          <span>{test.difficulty}</span>
        </div>
        <button className="exam-primary-button" onClick={onClose} type="button">
          Got it <span aria-hidden="true">✓</span>
        </button>
        <small>Practice test interaction will be available in a future update.</small>
      </section>
    </div>
  )
}

function ExamPrep() {
  const [expandedRevision, setExpandedRevision] = useState('')
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)

  return (
    <div className="exam-page">
      <header className="exam-page-header">
        <div>
          <span className="exam-kicker">FOCUSED PREPARATION</span>
          <h1>Exam Prep</h1>
          <p>Make your revision count. Focus on what matters most.</p>
        </div>
        <span aria-hidden="true" className="exam-header-stamp">EXAM<br />MODE</span>
      </header>

      <div className="exam-top-grid">
        <PracticeTestCard
          onStart={() => setIsTestDialogOpen(true)}
          test={examPrepData.practiceTest}
        />
        <ReadinessCard score={examPrepData.readiness} />
      </div>

      <div className="exam-content-grid">
        <WeakTopics topics={examPrepData.weakTopics} />
        <section aria-labelledby="revision-heading" className="exam-panel revision-panel">
          <div className="exam-panel-heading">
            <div>
              <span className="exam-kicker">BEFORE THE BIG DAY</span>
              <h2 id="revision-heading">Last Minute Revision</h2>
            </div>
            <span aria-hidden="true" className="revision-clock">◷</span>
          </div>
          <div className="revision-list">
            {examPrepData.revision.map((item) => (
              <RevisionCard
                isExpanded={expandedRevision === item.id}
                item={item}
                key={item.id}
                onToggle={() => setExpandedRevision((current) => current === item.id ? '' : item.id)}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="recommended-action-card">
        <span aria-hidden="true" className="recommended-action-icon">◎</span>
        <div className="recommended-action-copy">
          <span className="exam-kicker">YOUR RECOMMENDED NEXT STEP</span>
          <h2>Practice Graph Traversal</h2>
          <p>Graph accuracy is at 42%. A focused practice session can help strengthen this topic.</p>
        </div>
        <Link className="exam-secondary-button" to="/learn/data-structures/graphs">
          Practice topic <span aria-hidden="true">→</span>
        </Link>
        <button
          className="exam-primary-button start-exam-button"
          onClick={() => setIsTestDialogOpen(true)}
          type="button"
        >
          Start Exam <span aria-hidden="true">→</span>
        </button>
      </section>

      {isTestDialogOpen && (
        <TestSetupDialog
          onClose={() => setIsTestDialogOpen(false)}
          test={examPrepData.practiceTest}
        />
      )}
    </div>
  )
}

export default ExamPrep
