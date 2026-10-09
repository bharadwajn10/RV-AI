import { useCallback, useEffect, useRef, useState } from 'react'
import { VoiceSession } from '../services/voiceService.js'
import './VoiceAssistantWidget.css'

/**
 * VoiceAssistantWidget — Unified floating voice assistant for both Student and Educator views.
 *
 * Props:
 *   role   — 'student' | 'educator' (determines persona and system prompt)
 *   userId — optional user ID for session tracking
 */
function VoiceAssistantWidget({ role = 'student', userId = 'anon' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState('idle') // idle | listening | processing | speaking | disconnected
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTextMode, setIsTextMode] = useState(false)
  const [persona, setPersona] = useState('Agnes')
  const [error, setError] = useState('')
  const [streamingText, setStreamingText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)

  const sessionRef = useRef(null)
  const messagesEndRef = useRef(null)
  const panelRef = useRef(null)

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Create/destroy session when panel opens/closes
  useEffect(() => {
    if (!isOpen) {
      sessionRef.current?.disconnect()
      sessionRef.current = null
      return
    }

    const session = new VoiceSession({
      role,
      userId,
      onReady: (data) => {
        setPersona(data.persona || 'Agnes')
        if (data.greeting) {
          setMessages([{ sender: 'assistant', text: data.greeting }])
          session.speak(data.greeting)
        }
        setStatus('idle')
        setError('')
      },
      onStatus: (s) => setStatus(s),
      onTranscript: (data) => {
        if (data.sender === 'assistant') {
          setStreamingText('')
          setMessages((prev) => [...prev, { sender: 'assistant', text: data.text }])
          session.speak(data.text)
        } else if (data.sender === 'user') {
          setMessages((prev) => [...prev, { sender: 'user', text: data.text }])
        }
      },
      onToken: (token) => {
        setStreamingText((prev) => prev + token)
      },
      onError: (msg) => {
        setError(msg)
        setStatus('idle')
      },
      onSpeakingChange: (speaking) => {
        setIsSpeaking(speaking)
      },
    })

    session.connect()
    sessionRef.current = session

    return () => {
      session.disconnect()
    }
  }, [isOpen, role, userId])

  // Click-outside to close
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Don't close if clicking the launcher
        if (e.target.closest('.vaw-launcher')) return
        setIsOpen(false)
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('pointerdown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleMicToggle = useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    if (session.isListening) {
      session.stopListening()
    } else {
      setError('')
      session.startListening()
    }
  }, [])

  const handleStopSpeaking = useCallback(() => {
    sessionRef.current?.stopSpeaking()
  }, [])

  const handleSendText = useCallback((e) => {
    e?.preventDefault()
    const text = inputText.trim()
    if (!text || !sessionRef.current) return
    sessionRef.current.sendMessage(text)
    setInputText('')
    setError('')
  }, [inputText])

  const handleReset = useCallback(() => {
    sessionRef.current?.reset()
    setMessages([])
    setStreamingText('')
    setError('')
  }, [])

  const isStudent = role === 'student'
  const themeClass = isStudent ? 'vaw--student' : 'vaw--educator'

  return (
    <div className={`vaw ${themeClass}`}>
      {isOpen && (
        <section
          ref={panelRef}
          className="vaw-panel"
          aria-label={`Chat with ${persona}`}
          role="dialog"
        >
          {/* Header */}
          <header className="vaw-header">
            <div className="vaw-header__identity">
              <span className="vaw-avatar" aria-hidden="true">
                ✦
              </span>
              <div>
                <strong>{persona}</strong>
                <span>{isStudent ? 'Your learning companion' : 'Your teaching assistant'}</span>
              </div>
            </div>
            <div className="vaw-header__actions">
              <button
                className="vaw-header__reset"
                type="button"
                aria-label="Reset conversation"
                onClick={handleReset}
                title="Reset conversation"
              >
                ↻
              </button>
              <button
                className="vaw-header__close"
                type="button"
                aria-label={`Close ${persona}`}
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
          </header>

          {/* Messages */}
          <div className="vaw-messages" aria-live="polite">
            {messages.length === 0 && !streamingText && (
              <div className="vaw-welcome">
                <strong>
                  Hello! I'm Agnes
                </strong>
                <p>
                  {isStudent
                    ? 'Ask me anything about your subjects. Tap the mic or type below.'
                    : 'Ask me about students, analytics, or assignments. Tap the mic or type below.'}
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                className={`vaw-bubble vaw-bubble--${msg.sender}`}
                key={`${msg.sender}-${i}`}
              >
                <p>{msg.text}</p>
                {msg.sender === 'assistant' && (
                  <button
                    className="vaw-bubble__speak"
                    type="button"
                    aria-label="Replay this message"
                    onClick={() => sessionRef.current?.speak(msg.text)}
                  >
                    🔊
                  </button>
                )}
              </div>
            ))}

            {streamingText && (
              <div className="vaw-bubble vaw-bubble--assistant vaw-bubble--streaming">
                <p>{streamingText}<span className="vaw-cursor" /></p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Notice */}
          {error && <p className="vaw-notice" role="alert">{error}</p>}

          {/* Voice Controls */}
          <div className="vaw-controls">
            {isSpeaking ? (
              <button
                className="vaw-mic-button is-speaking"
                type="button"
                aria-label="Stop Agnes from speaking"
                onClick={handleStopSpeaking}
              >
                <span aria-hidden="true">⏹</span>
              </button>
            ) : (
              <button
                className={`vaw-mic-button${status === 'listening' ? ' is-listening' : ''}${status === 'processing' ? ' is-processing' : ''}`}
                type="button"
                aria-label={status === 'listening' ? 'Stop listening' : 'Start voice chat'}
                onClick={handleMicToggle}
                disabled={status === 'processing'}
              >
                <span aria-hidden="true">
                  {status === 'listening' ? '■' : status === 'processing' ? '⏳' : '🎙'}
                </span>
              </button>
            )}
            <strong>
              {isSpeaking
                ? 'Agnes is speaking... tap to stop'
                : status === 'listening'
                  ? 'Listening... will auto-send after silence'
                  : status === 'processing'
                    ? `${persona} is thinking...`
                    : `Tap the mic and talk to ${persona}`}
            </strong>
            <button
              className="vaw-text-toggle"
              type="button"
              onClick={() => setIsTextMode((m) => !m)}
            >
              {isTextMode ? 'Back to voice' : 'Type instead'}
            </button>
          </div>

          {/* Text Input */}
          {isTextMode && (
            <form className="vaw-composer" onSubmit={handleSendText}>
              <input
                aria-label={`Message ${persona}`}
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button
                className="vaw-send"
                type="submit"
                aria-label="Send message"
                disabled={status === 'processing' || !inputText.trim()}
              >
                ↑
              </button>
            </form>
          )}
        </section>
      )}

      {/* Floating Launcher */}
      <button
        className={`vaw-launcher${isOpen ? ' is-open' : ''}`}
        type="button"
        aria-label={isOpen ? `Close ${persona}` : `Talk to ${persona}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((o) => !o)}
      >
        <span className="vaw-launcher__icon" aria-hidden="true">
          <svg className="vaw-launcher__robot" fill="none" viewBox="0 0 48 48">
            <path d="M11 23v-3a13 13 0 0 1 26 0v3" stroke="#DAD7FF" strokeLinecap="round" strokeWidth="4.5" />
            <path d="M24 8V6" stroke="#B8B7F8" strokeLinecap="round" strokeWidth="2.5" />
            <circle cx="24" cy="5" r="2.7" fill="#FFE59A" />
            <rect x="6.5" y="20" width="8" height="13" rx="4" fill="#928FEA" stroke="#FFF" strokeWidth="1.7" />
            <rect x="33.5" y="20" width="8" height="13" rx="4" fill="#928FEA" stroke="#FFF" strokeWidth="1.7" />
            <rect x="13" y="13.5" width="22" height="26" rx="9.5" fill="url(#vawRobotFace)" stroke="#FFF" strokeWidth="1.7" />
            <ellipse cx="19.2" cy="25.3" rx="2.9" ry="3.6" fill="#303A69" />
            <ellipse cx="28.8" cy="25.3" rx="2.9" ry="3.6" fill="#303A69" />
            <ellipse cx="20" cy="24" rx="1.1" ry="1.3" fill="#FFF" />
            <ellipse cx="29.6" cy="24" rx="1.1" ry="1.3" fill="#FFF" />
            <path d="M20.5 31.5c1.8 2.6 5.2 2.6 7 0" stroke="#394571" strokeLinecap="round" strokeWidth="1.8" />
            <defs>
              <linearGradient id="vawRobotFace" x1="15" x2="35" y1="15" y2="38" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D6E7FF" />
                <stop offset="1" stopColor="#BFC4F8" />
              </linearGradient>
            </defs>
          </svg>
        </span>
        <span className="vaw-launcher__label">{persona}</span>
      </button>
    </div>
  )
}

export default VoiceAssistantWidget
