import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCourses } from '../context/useCourses.js'
import { useTasks } from '../context/useTasks.js'
import { subjectTopics } from '../data/mockData.js'
import VoiceAssistantPanel from './VoiceAssistantPanel.jsx'
import './VoiceAssistantBubble.css'

const topicNameFromId = (subjectId, topicId) => {
  if (topicId === 'binary-trees') return 'Binary Trees'
  return (subjectTopics[subjectId] || []).find((topic) => topic.id === topicId)?.name || topicId
}

function getPageContext(pathname, courses, tasks) {
  const segments = pathname.split('/').filter(Boolean)
  const subjectIndex = segments[0] === 'subjects' ? 1 : segments[0] === 'learn' ? 1 : -1
  const subjectId = subjectIndex >= 0 ? segments[subjectIndex] : ''
  const subject = courses.find((course) => course.id === subjectId)

  if (segments[0] === 'learn' && subject) {
    const topic = topicNameFromId(subject.id, segments[2])
    return {
      subjectId: subject.id,
      subject: subject.name,
      topic,
      greeting: `You're studying ${topic}. Want me to explain something?`,
      source: 'learning',
    }
  }

  if (segments[0] === 'subjects' && subject) {
    return {
      subjectId: subject.id,
      subject: subject.name,
      topic: '',
      greeting: `You're exploring ${subject.name}. Want help with a topic?`,
      source: 'subject',
    }
  }

  if (segments[0] === 'tasks') {
    const task = tasks.find((item) => item.id === segments[1])
    if (task) {
      return {
        subjectId: task.subjectId || '',
        subject: task.subject || '',
        topic: task.title,
        taskId: task.id,
        greeting: `Want me to help you understand "${task.title}"?`,
        source: 'task',
      }
    }
    return {
      subjectId: '',
      subject: '',
      topic: '',
      greeting: 'Need help understanding this task?',
      source: 'task',
    }
  }

  if (segments[0] === 'calendar') {
    return {
      subjectId: '',
      subject: '',
      topic: '',
      greeting: 'Need help planning your upcoming deadlines?',
      source: 'calendar',
    }
  }

  if (segments[0] === 'dashboard' || segments.length === 0) {
    return {
      subjectId: '',
      subject: '',
      topic: '',
      greeting: 'What would you like to learn today?',
      source: 'dashboard',
    }
  }

  return {
    subjectId: '',
    subject: '',
    topic: '',
    greeting: 'What can I help you learn today?',
    source: segments[0] || 'page',
  }
}

function VoiceAssistantBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { courses } = useCourses()
  const { tasks } = useTasks()
  const context = getPageContext(location.pathname, courses, tasks)

  useEffect(() => {
    function handleOutsidePointer(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    function handleEscape(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', handleOutsidePointer)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function openVoiceTutor() {
    try {
      window.localStorage.setItem(
        'studyspace-voice-assistant-context',
        JSON.stringify({ ...context, savedAt: new Date().toISOString() }),
      )
    } catch (error) {
      console.error('Could not save the Voice Tutor context.', error)
    }
    setIsOpen(false)
    navigate('/voice', { state: { assistantContext: context } })
  }

  return (
    <div className="voice-assistant-bubble" ref={containerRef}>
      {isOpen && (
        <VoiceAssistantPanel
          context={context}
          onClose={() => setIsOpen(false)}
          onOpenTutor={openVoiceTutor}
        />
      )}
      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close Study Buddy' : 'Talk to Study Buddy'}
        className={`voice-assistant-bubble-button${isOpen ? ' is-open' : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span aria-hidden="true" className="bubble-sparkle">✦</span>
        <svg aria-hidden="true" className="bubble-robot" fill="none" viewBox="0 0 48 48">
          <path d="M11 23v-3a13 13 0 0 1 26 0v3" stroke="#DAD7FF" strokeLinecap="round" strokeWidth="4.5" />
          <path d="M24 8V6" stroke="#B8B7F8" strokeLinecap="round" strokeWidth="2.5" />
          <circle cx="24" cy="5" r="2.7" fill="#FFE59A" />
          <rect x="6.5" y="20" width="8" height="13" rx="4" fill="#928FEA" stroke="#FFF" strokeWidth="1.7" />
          <rect x="33.5" y="20" width="8" height="13" rx="4" fill="#928FEA" stroke="#FFF" strokeWidth="1.7" />
          <rect x="13" y="13.5" width="22" height="26" rx="9.5" fill="url(#studyBuddyRobotFace)" stroke="#FFF" strokeWidth="1.7" />
          <path d="M17.2 20.5c1.1-1 2.8-1 3.9 0m5.8 0c1.1-1 2.8-1 3.9 0" stroke="#FFF" strokeLinecap="round" strokeOpacity=".8" strokeWidth="1.7" />
          <ellipse cx="19.2" cy="25.3" rx="2.9" ry="3.6" fill="#303A69" />
          <ellipse cx="28.8" cy="25.3" rx="2.9" ry="3.6" fill="#303A69" />
          <ellipse cx="20" cy="24" rx="1.1" ry="1.3" fill="#FFF" />
          <ellipse cx="29.6" cy="24" rx="1.1" ry="1.3" fill="#FFF" />
          <circle cx="17.2" cy="30" r="1.1" fill="#F28FAE" />
          <circle cx="18.8" cy="30.7" r="1.1" fill="#F28FAE" />
          <circle cx="29.2" cy="30.7" r="1.1" fill="#F28FAE" />
          <circle cx="30.8" cy="30" r="1.1" fill="#F28FAE" />
          <path d="M20.5 31.5c1.8 2.6 5.2 2.6 7 0" stroke="#394571" strokeLinecap="round" strokeWidth="1.8" />
          <defs>
            <linearGradient id="studyBuddyRobotFace" x1="15" x2="35" y1="15" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D6E7FF" />
              <stop offset="1" stopColor="#BFC4F8" />
            </linearGradient>
          </defs>
        </svg>
        <span aria-hidden="true" className="bubble-dot" />
      </button>
    </div>
  )
}

export default VoiceAssistantBubble
