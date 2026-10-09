import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { progressAnalytics } from '../data/mockData.js'
import './Progress.css'

function OverallUnderstanding({ score }) {
  return (
    <section aria-labelledby="overall-understanding-heading" className="progress-panel progress-overall">
      <div className="progress-panel-heading">
        <div>
          <span className="progress-eyebrow">YOUR LEARNING SNAPSHOT</span>
          <h2 id="overall-understanding-heading">Overall understanding</h2>
        </div>
        <span aria-hidden="true" className="progress-heading-icon">✦</span>
      </div>
      <div className="overall-score-layout">
        <div
          aria-label={`Overall understanding ${score}%`}
          className="understanding-donut"
          role="img"
          style={{ '--understanding-angle': `${score * 3.6}deg` }}
        >
          <div className="understanding-donut-center">
            <strong>{score}<span>%</span></strong>
            <small>UNDERSTOOD</small>
          </div>
        </div>
        <div className="overall-score-copy">
          <strong>You&apos;re building a strong foundation.</strong>
          <p>Your recent study activity shows steady progress across your learning skills.</p>
          <div className="score-legend">
            <span><i className="legend-dot legend-dot-complete" /> Mastered</span>
            <span><i className="legend-dot legend-dot-remaining" /> In progress</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function SkillBreakdown({ skills }) {
  return (
    <section aria-labelledby="skill-breakdown-heading" className="progress-panel skill-breakdown">
      <div className="progress-panel-heading">
        <div>
          <span className="progress-eyebrow">SKILL AREAS</span>
          <h2 id="skill-breakdown-heading">Learning breakdown</h2>
        </div>
        <span aria-hidden="true" className="breakdown-badge">4 areas</span>
      </div>
      <div className="skill-bars">
        {skills.map((skill) => (
          <div className="skill-bar-row" key={skill.name}>
            <div className="skill-bar-label">
              <span>{skill.name}</span>
              <strong>{skill.score}%</strong>
            </div>
            <div
              aria-label={`${skill.name}: ${skill.score}%`}
              aria-valuemax="100"
              aria-valuemin="0"
              aria-valuenow={skill.score}
              className={`analytics-track skill-track skill-track-${skill.tone}`}
              role="progressbar"
            >
              <span style={{ width: `${skill.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TopicMastery({ topics }) {
  return (
    <section aria-labelledby="topic-mastery-heading" className="progress-panel topic-mastery">
      <div className="progress-panel-heading">
        <div>
          <span className="progress-eyebrow">DATA STRUCTURES</span>
          <h2 id="topic-mastery-heading">Topic mastery</h2>
        </div>
        <Link className="mastery-link" to="/subjects/data-structures">
          View subject <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="mastery-list">
        {topics.map((topic) => (
          <Link
            className={`mastery-row${topic.score < 60 ? ' mastery-row-focus' : ''}`}
            key={topic.name}
            to={`/learn/data-structures/${topic.slug}`}
          >
            <span className="mastery-topic">{topic.name}</span>
            <span
              aria-label={`${topic.name}: ${topic.score}%`}
              aria-valuemax="100"
              aria-valuemin="0"
              aria-valuenow={topic.score}
              className="analytics-track mastery-track"
              role="progressbar"
            >
              <span style={{ width: `${topic.score}%` }} />
            </span>
            <strong>{topic.score}%</strong>
            {topic.score < 60 && <span className="mastery-focus-label">Focus</span>}
          </Link>
        ))}
      </div>
    </section>
  )
}

function ActivitySummary({ metrics }) {
  return (
    <section aria-label="Learning activity summary" className="activity-summary">
      {metrics.map((metric) => (
        <article className={`activity-metric activity-metric-${metric.tone}`} key={metric.label}>
          <span aria-hidden="true" className="activity-icon">{metric.icon}</span>
          <div>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        </article>
      ))}
    </section>
  )
}

function LearningInsight({ insight }) {
  return (
    <section aria-labelledby="learning-insight-heading" className="learning-insight">
      <div aria-hidden="true" className="insight-spark">✦</div>
      <div className="insight-copy">
        <span className="progress-eyebrow">AI LEARNING INSIGHT</span>
        <h2 id="learning-insight-heading">A focused practice session can move you forward</h2>
        <p>{insight.message}</p>
        <div className="insight-recommendation">
          <span>RECOMMENDED NEXT STEP</span>
          <strong>{insight.recommendation}</strong>
        </div>
      </div>
      <Link className="insight-action" to={insight.to}>
        Practice now <span aria-hidden="true">→</span>
      </Link>
    </section>
  )
}

function Progress() {
  return (
    <div className="progress-page">
      <PageHeader
        description="A clear view of what you know and where to focus next."
        title="Progress"
      />
      <div className="progress-top-grid">
        <OverallUnderstanding score={progressAnalytics.overallUnderstanding} />
        <SkillBreakdown skills={progressAnalytics.skills} />
      </div>
      <ActivitySummary metrics={progressAnalytics.metrics} />
      <div className="progress-bottom-grid">
        <TopicMastery topics={progressAnalytics.topicMastery} />
        <LearningInsight insight={progressAnalytics.insight} />
      </div>
    </div>
  )
}

export default Progress
