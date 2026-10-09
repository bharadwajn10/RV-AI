import { useEffect, useState } from 'react'

const quickActions = [
  { label: 'Ask a question', icon: '🎙' },
  { label: 'Explain this topic', icon: '🧠' },
  { label: 'Rapid Fire', icon: '⚡' },
  { label: 'Clear a doubt', icon: '❓' },
]

function createReply(action, context, question = '') {
  const topic = context.topic ? ` about ${context.topic}` : ''
  const subject = context.subject ? ` in ${context.subject}` : ''

  if (question) {
    return context.topic
      ? `Let’s explore that${subject}, using ${context.topic} as our starting point. In a full tutor session, I can break this down with your course materials.`
      : `That’s a good question. Open Voice Tutor to choose a subject and topic, and I can guide you with relevant course materials.`
  }

  if (action === 'Explain this topic') {
    return context.topic
      ? `${context.topic}${subject} can be easier to understand when we build it up one step at a time. Open Voice Tutor for a focused explanation.`
      : 'Choose a topic in Voice Tutor and I’ll help you build a clear, step-by-step understanding.'
  }
  if (action === 'Rapid Fire') {
    return context.topic
      ? `Ready for a quick round${topic}${subject}? Open Voice Tutor to practice with short questions.`
      : 'Pick a topic in Voice Tutor and try a quick round of short practice questions.'
  }
  if (action === 'Clear a doubt') {
    return context.topic
      ? `Tell me what feels unclear${topic}${subject}, and we can work through it together.`
      : 'Tell me what feels unclear, or choose a topic in Voice Tutor for a focused doubt-solving session.'
  }
  return context.topic
    ? `Ask me anything${topic}${subject}. You can also open Voice Tutor for a full guided session.`
    : 'What would you like to learn? Open Voice Tutor to choose a subject and start a guided session.'
}

function VoiceAssistantPanel({ context, onClose, onOpenTutor }) {
  const [question, setQuestion] = useState('')
  const [reply, setReply] = useState('')
  const [voiceState, setVoiceState] = useState('idle')

  useEffect(() => {
    if (voiceState !== 'listening') return undefined
    const timer = window.setTimeout(() => {
      setReply(createReply('Ask a question', context))
      setVoiceState('response')
    }, 1400)
    return () => window.clearTimeout(timer)
  }, [context, voiceState])

  function handleAction(action) {
    setVoiceState('idle')
    setReply(createReply(action, context))
    if (action === 'Ask a question') {
      document.getElementById('study-buddy-question')?.focus()
    }
  }

  function handleQuestionSubmit(event) {
    event.preventDefault()
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion) return
    setReply(createReply('Ask a question', context, trimmedQuestion))
    setQuestion('')
    setVoiceState('response')
  }

  function handleTalk() {
    setReply('')
    setVoiceState('listening')
  }

  return (
    <section
      aria-labelledby="study-buddy-title"
      aria-modal="false"
      className="study-buddy-panel"
      role="dialog"
    >
      <header className="study-buddy-header">
        <span aria-hidden="true" className="study-buddy-avatar">✦</span>
        <div>
          <h2 id="study-buddy-title">Study Buddy</h2>
          <span>Your friendly learning companion</span>
        </div>
        <button aria-label="Close Study Buddy" className="study-buddy-close" onClick={onClose} type="button">×</button>
      </header>

      <div aria-live="polite" className="study-buddy-body">
        <div className="study-buddy-greeting">
          <span aria-hidden="true">👋</span>
          <p>{context.greeting}</p>
        </div>

        {reply && (
          <p className="study-buddy-reply">
            <span aria-hidden="true">✦</span>{reply}
          </p>
        )}

        {voiceState === 'listening' && (
          <div className="study-buddy-listening">
            <span aria-hidden="true" className="study-buddy-listening-icon">🎙</span>
            <span>Listening...</span>
          </div>
        )}
        {voiceState === 'response' && !reply && (
          <span className="study-buddy-response-status">Ready when you are.</span>
        )}

        <div className="study-buddy-quick-actions" aria-label="Quick actions">
          {quickActions.map((action) => (
            <button key={action.label} onClick={() => handleAction(action.label)} type="button">
              <span aria-hidden="true">{action.icon}</span>{action.label}
            </button>
          ))}
        </div>

        <button
          className={`study-buddy-talk${voiceState === 'listening' ? ' is-listening' : ''}`}
          disabled={voiceState === 'listening'}
          onClick={handleTalk}
          type="button"
        >
          <span aria-hidden="true">🎙</span>
          {voiceState === 'listening' ? 'Listening...' : 'Talk to me'}
        </button>

        <form className="study-buddy-question-form" onSubmit={handleQuestionSubmit}>
          <label className="visually-hidden" htmlFor="study-buddy-question">Ask Study Buddy anything</label>
          <input
            id="study-buddy-question"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask me anything..."
            value={question}
          />
          <button aria-label="Send question" disabled={!question.trim()} type="submit">→</button>
        </form>

        <button className="study-buddy-open-tutor" onClick={onOpenTutor} type="button">
          Open Voice Tutor <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  )
}

export default VoiceAssistantPanel
