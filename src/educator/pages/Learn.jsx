import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProgressBar from '../components/ProgressBar.jsx'
import { useCourses } from '../context/useCourses.js'
import { subjectTopics } from '../data/mockData.js'
import './Learn.css'

const levels = ['Beginner', 'Intermediate', 'Advanced']
const preferences = [
  { label: 'Visual', icon: '◉' },
  { label: 'Example', icon: '▧' },
  { label: 'Detailed', icon: '≡' },
  { label: 'Simplified', icon: '✦' },
]

const confidenceFeedback = {
  'I understand': 'Great work — keep going at your own pace.',
  Somewhat: 'That’s a good start. Try the example once more when you’re ready.',
  "I'm confused": 'That’s okay. You can switch to a simpler explanation or review the diagram.',
}

function BinaryTreeDiagram() {
  return (
    <div aria-label="A binary tree with 10 at the root, 5 and 20 as children, and 3 and 7 under 5." className="tree-diagram">
      <span className="tree-line tree-line-root-left" />
      <span className="tree-line tree-line-root-right" />
      <span className="tree-line tree-line-left-left" />
      <span className="tree-line tree-line-left-right" />
      <div className="diagram-node diagram-node-root">10</div>
      <div className="diagram-node diagram-node-five">5</div>
      <div className="diagram-node diagram-node-twenty">20</div>
      <div className="diagram-node diagram-node-three">3</div>
      <div className="diagram-node diagram-node-seven">7</div>
    </div>
  )
}

function ConceptContent() {
  return (
    <>
      <section aria-labelledby="concept-explanation-title" className="learn-card explanation-card">
        <div className="learn-card-heading">
          <span aria-hidden="true" className="learn-section-icon">✦</span>
          <div>
            <span className="learn-section-kicker">THE BIG IDEA</span>
            <h2 id="concept-explanation-title">What is a binary tree?</h2>
          </div>
        </div>
        <div className="definition-block">
          <span>IN SIMPLE TERMS</span>
          <p>A binary tree is a way to organize data where each item can connect to at most two other items.</p>
        </div>
        <p className="beginner-explanation">
          Each item is called a <strong>node</strong>. The first node at the top is the <strong>root</strong>.
          Nodes below it are its children — usually called the left child and right child. This branching
          structure makes it easier to find and organize information.
        </p>
        <div className="example-callout">
          <span aria-hidden="true">↳</span>
          <p><strong>Example:</strong> A node with the value 10 can have 5 on its left and 20 on its right.
            The node 5 can then branch to 3 and 7.</p>
        </div>
      </section>

      <section aria-labelledby="visual-explanation-title" className="learn-card visual-card">
        <div className="learn-card-heading">
          <span aria-hidden="true" className="learn-section-icon learn-section-icon-green">⌘</span>
          <div>
            <span className="learn-section-kicker">SEE THE STRUCTURE</span>
            <h2 id="visual-explanation-title">A binary tree, at a glance</h2>
          </div>
        </div>
        <BinaryTreeDiagram />
        <div className="diagram-legend">
          <span><i className="legend-root" /> Root node</span>
          <span><i className="legend-child" /> Child node</span>
          <span>Each node has at most 2 children</span>
        </div>
      </section>

      <section className="analogy-card">
        <span aria-hidden="true" className="analogy-icon">🌿</span>
        <div>
          <span className="learn-section-kicker">THINK OF IT LIKE...</span>
          <h2>A family tree with just two branches</h2>
          <p>Imagine each person can point to up to two children. Start at the oldest ancestor (the root), then follow the branches down to find someone. A binary tree works in a similar way with data.</p>
        </div>
      </section>
    </>
  )
}

function LearningLevelControl({ level, onChange }) {
  return (
    <section aria-labelledby="learning-level-title" className="learn-card preference-card">
      <div className="preference-heading">
        <span aria-hidden="true" className="preference-icon">◎</span>
        <div>
          <h2 id="learning-level-title">Explanation level</h2>
          <p>Choose how much detail you want.</p>
        </div>
      </div>
      <div aria-label="Explanation level" className="segmented-control">
        {levels.map((item) => (
          <button
            aria-pressed={level === item}
            className={level === item ? 'is-selected' : ''}
            key={item}
            onClick={() => onChange(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
    </section>
  )
}

function LearningPreferences({ preference, onChange }) {
  return (
    <section aria-labelledby="learning-preferences-title" className="learn-card preference-card">
      <div className="preference-heading">
        <span aria-hidden="true" className="preference-icon preference-icon-blue">☷</span>
        <div>
          <h2 id="learning-preferences-title">How do you like to learn?</h2>
          <p>Pick a style to focus on.</p>
        </div>
      </div>
      <div className="preference-options">
        {preferences.map((item) => (
          <button
            aria-pressed={preference === item.label}
            className={`preference-button${preference === item.label ? ' is-selected' : ''}`}
            key={item.label}
            onClick={() => onChange(item.label)}
            type="button"
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </section>
  )
}

function VoiceActions({ activeAction, onAction }) {
  const actions = [
    { label: 'Explain this', icon: '🎤' },
    { label: 'Listen', icon: '🔊' },
    { label: "I'm confused", icon: '❓' },
  ]

  return (
    <section aria-label="Learning support actions" className="voice-actions">
      {actions.map((action) => (
        <button
          aria-pressed={activeAction === action.label}
          className={`voice-action-button${activeAction === action.label ? ' is-active' : ''}`}
          key={action.label}
          onClick={() => onAction(action.label)}
          type="button"
        >
          <span aria-hidden="true">{action.icon}</span>
          {action.label}
        </button>
      ))}
    </section>
  )
}

function UnderstandingCheck({ confidence, onChange }) {
  const choices = ['I understand', 'Somewhat', "I'm confused"]

  return (
    <section aria-labelledby="understanding-title" className="understanding-card">
      <div className="understanding-copy">
        <span className="learn-section-kicker">QUICK CHECK-IN</span>
        <h2 id="understanding-title">How confident are you with this concept?</h2>
      </div>
      <div className="understanding-options">
        {choices.map((choice) => (
          <button
            aria-pressed={confidence === choice}
            className={`understanding-button${confidence === choice ? ' is-selected' : ''}`}
            key={choice}
            onClick={() => onChange(choice)}
            type="button"
          >
            {choice}
          </button>
        ))}
      </div>
      {confidence && (
        <p aria-live="polite" className="understanding-feedback">
          {confidenceFeedback[confidence]}
        </p>
      )}
    </section>
  )
}

function Learn() {
  const { subjectId, topicId } = useParams()
  const [level, setLevel] = useState('Beginner')
  const [preference, setPreference] = useState('Visual')
  const [confidence, setConfidence] = useState('')
  const [activeVoiceAction, setActiveVoiceAction] = useState('')
  const { courses, updateCourseProgress, error } = useCourses()

  const subject = courses.find((item) => item.id === subjectId)
  const topics = subjectTopics[subjectId] || []
  const selectedTopic = topics.find((topic) => topic.id === topicId)
  const topic = topicId === 'binary-trees'
    ? { id: 'binary-trees', name: 'Binary Trees', difficulty: 'Medium', estimatedTime: '1 hr 20 min', progress: 58 }
    : selectedTopic

  if (!subject || !topic) {
    return (
      <div className="learn-not-found">
        <span aria-hidden="true">⌕</span>
        <h1>Topic not found</h1>
        <p>Choose a topic from your subject overview to keep learning.</p>
        <Link className="learn-primary-button" to={subject ? `/subjects/${subject.id}` : '/subjects'}>
          Back to subjects
        </Link>
      </div>
    )
  }

  const topicIndex = topics.findIndex((item) => item.id === (topicId === 'binary-trees' ? 'trees' : topicId))
  const previousTopic = topicIndex > 0 ? topics[topicIndex - 1] : null
  const nextTopic = topicIndex >= 0 && topicIndex < topics.length - 1 ? topics[topicIndex + 1] : null
  const isBinaryTreesLesson = topicId === 'binary-trees'
  const lessonUrl = (lessonTopic) => `/learn/${subject.id}/${lessonTopic.id}`

  function updateConfidence(choice) {
    setConfidence(choice)
    if (choice === 'I understand') {
      updateCourseProgress(subject.id, subject.progress + 10)
    } else if (choice === 'Somewhat') {
      updateCourseProgress(subject.id, subject.progress + 5)
    }
  }

  return (
    <div className="learn-page">
      {error && <p aria-live="polite" className="course-storage-error">{error}</p>}
      <nav aria-label="Breadcrumb" className="learn-breadcrumb">
        <Link to="/dashboard">Home</Link>
        <span aria-hidden="true">›</span>
        <Link to={`/subjects/${subject.id}`}>{subject.name}</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{topic.name}</span>
      </nav>

      <header className="learn-topic-header">
        <div className="learn-topic-title">
          <span aria-hidden="true" className="learn-topic-icon">🌳</span>
          <div>
            <span className="learn-topic-subject">{subject.name.toUpperCase()}</span>
            <h1>{topic.name}</h1>
            <p>One step at a time — you’re building a strong foundation.</p>
          </div>
        </div>
        <div className="learn-topic-info">
          <span className="topic-difficulty-pill">{topic.difficulty}</span>
          <span className="topic-time-pill"><span aria-hidden="true">◷</span> {topic.estimatedTime}</span>
        </div>
        <div className="learn-topic-progress">
          <ProgressBar label="Topic progress" value={topic.progress} />
        </div>
      </header>

      <div className="learn-layout">
        <main className="learn-main-column">
          {isBinaryTreesLesson ? (
            <ConceptContent />
          ) : (
            <section className="learn-card lesson-placeholder">
              <span aria-hidden="true">✦</span>
              <h2>{topic.name}</h2>
              <p>This topic is in your learning path. Its lesson overview will be available here.</p>
            </section>
          )}
        </main>

        <aside aria-label="Learning preferences and support" className="learn-side-column">
          <LearningLevelControl level={level} onChange={setLevel} />
          <LearningPreferences preference={preference} onChange={setPreference} />
          <VoiceActions activeAction={activeVoiceAction} onAction={setActiveVoiceAction} />
          {activeVoiceAction && (
            <p aria-live="polite" className="voice-action-feedback">
              {activeVoiceAction === 'Listen'
                ? 'Listen mode is ready for this lesson.'
                : activeVoiceAction === "I'm confused"
                  ? 'We’ll take this concept one step at a time.'
                  : `${level === 'Intermediate' ? 'An' : 'A'} ${level.toLowerCase()} explanation is ready to explore.`}
            </p>
          )}
        </aside>
      </div>

      <UnderstandingCheck confidence={confidence} onChange={updateConfidence} />

      <nav aria-label="Topic navigation" className="lesson-pagination">
        {previousTopic ? (
          <Link className="lesson-pagination-link lesson-previous" to={lessonUrl(previousTopic)}>
            <span aria-hidden="true">←</span>
            <span><small>PREVIOUS TOPIC</small><strong>{previousTopic.name}</strong></span>
          </Link>
        ) : (
          <Link className="lesson-pagination-link lesson-previous" to={`/subjects/${subject.id}`}>
            <span aria-hidden="true">←</span>
            <span><small>BACK TO SUBJECT</small><strong>Topic overview</strong></span>
          </Link>
        )}
        {nextTopic ? (
          <Link className="lesson-pagination-link lesson-next" to={lessonUrl(nextTopic)}>
            <span><small>NEXT TOPIC</small><strong>{nextTopic.name}</strong></span>
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <Link className="lesson-pagination-link lesson-next" to={`/subjects/${subject.id}`}>
            <span><small>SUBJECT COMPLETE</small><strong>Back to overview</strong></span>
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </nav>
    </div>
  )
}

export default Learn
