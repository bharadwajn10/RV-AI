import { useEffect, useRef, useState, useCallback } from 'react'
import { useCourses } from '../context/useCourses.js'
import { voiceTutorCourses } from '../data/voiceTutorData.js'
import { VoiceSession } from '../services/voiceService.js'
import './VoiceAssistant.css'

const voiceModes = [
  { name: 'Explain', icon: '🎓', description: 'Learn a concept step by step' },
  { name: 'Rapid Fire', icon: '⚡', description: 'Try a quick knowledge round' },
  { name: 'Doubt Solver', icon: '❓', description: 'Work through a tricky question' },
  { name: 'Viva Mode', icon: '🗣️', description: 'Practice explaining your thinking' },
]

const learningGoals = [
  'Understand the concept',
  'Practice questions',
  'Exam preparation',
  'Revise quickly',
  'Deep discussion',
]
const difficulties = ['Beginner', 'Intermediate', 'Advanced']
const conversationStyles = [
  'Explain step-by-step',
  'Socratic questioning',
  'Ask me questions',
  'Casual discussion',
  'Rapid-fire',
]
const languages = ['English', 'Kannada', 'Hindi', 'Other (English demo)']

const initialMessages = [
  { role: 'student', speaker: 'You', message: 'What is a binary tree?' },
  {
    role: 'tutor',
    speaker: 'Agnes',
    message:
      'A binary tree is a data structure where each node can have at most two children, often called the left child and right child. Imagine it like a family tree that branches into two paths at each step.',
  },
]

const initialRecentSession = {
  subject: 'Data Structures',
  topics: ['Binary Trees', 'BST'],
}

const stateLabels = {
  idle: 'Tap the microphone to speak',
  listening: 'Listening… will auto-send after 2s silence',
  processing: 'Agnes is thinking…',
  speaking: 'Agnes is speaking… tap to stop',
  response: 'Here’s your explanation',
}

function MicrophoneIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <rect height="12" rx="4" width="6" x="9" y="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8" />
    </svg>
  )
}

function ConversationMessage({ message, onPlay, isPlaying, helpful, onHelpful }) {
  const isTutor = message.role === 'tutor'

  return (
    <article className={`conversation-message message-${message.role}`}>
      <div aria-hidden="true" className={`message-avatar${isTutor ? ' tutor-avatar' : ''}`}>
        {isTutor ? '✦' : 'S'}
      </div>
      <div className="message-content">
        <div className="message-speaker">
          {message.speaker}
          {isTutor && <span className="ai-badge">AGNES AI</span>}
        </div>
        <p>{message.message}</p>
        {isTutor && (
          <div className="response-actions">
            <button
              aria-pressed={isPlaying}
              className={`response-action-button${isPlaying ? ' is-active' : ''}`}
              onClick={onPlay}
              type="button"
            >
              <span aria-hidden="true">{isPlaying ? '⏸' : '🔊'}</span>
              {isPlaying ? 'Playing' : 'Play'}
            </button>
            <span className="response-action-divider" />
            <button
              aria-pressed={helpful === true}
              className={`response-action-button${helpful === true ? ' is-active' : ''}`}
              onClick={() => onHelpful(true)}
              type="button"
            >
              <span aria-hidden="true">👍</span> Helpful
            </button>
            <button
              aria-pressed={helpful === false}
              className={`response-action-button${helpful === false ? ' is-active' : ''}`}
              onClick={() => onHelpful(false)}
              type="button"
            >
              <span aria-hidden="true">👎</span> Not helpful
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

function buildTutorResponse(question, session) {
  const topic = session.topics.find((selectedTopic) =>
    question.toLowerCase().includes(selectedTopic.toLowerCase()),
  ) || session.topics[0]
  const material = session.materials[0] || `${session.subject} learning materials`
  const difficultyText = {
    Beginner: 'I’ll start with an intuitive explanation and build from the basics.',
    Intermediate: 'I’ll connect the core idea to how it is used in practice.',
    Advanced: 'I’ll focus on the deeper properties and the trade-offs involved.',
  }[session.difficulty]
  const goalFocus = {
    'Understand the concept': 'build a clear understanding',
    'Practice questions': 'practice applying the idea',
    'Exam preparation': 'prepare for exam-style questions',
    'Revise quickly': 'review the key points quickly',
    'Deep discussion': 'explore the idea in depth',
  }[session.goal]
  const styleFocus = {
    'Explain step-by-step': 'I’ll break it into small steps.',
    'Socratic questioning': 'I’ll guide you with questions as we go.',
    'Ask me questions': 'I’ll check your understanding with questions.',
    'Casual discussion': 'We’ll keep the discussion relaxed and conversational.',
    'Rapid-fire': 'I’ll keep each exchange short and quick.',
  }[session.style]
  const concept = topic.toLowerCase().includes('binary tree')
    ? 'binary-tree'
    : topic.toLowerCase() === 'bst' || topic.toLowerCase().includes('binary search tree')
      ? 'bst'
      : topic.toLowerCase().includes('avl')
        ? 'avl'
        : 'general'
  const englishExplanations = {
    'binary-tree': 'A binary tree is a hierarchical structure where each node can have at most two children: a left child and a right child.',
    bst: 'A binary search tree is a binary tree that keeps smaller values to the left and larger values to the right, making search more efficient when it stays balanced.',
    avl: 'An AVL tree is a self-balancing binary search tree that uses rotations to keep the heights of its left and right subtrees close.',
    general: `The key idea in ${topic} is to understand its core definition and how that idea is used in ${session.subject}.`,
  }
  const hindiExplanations = {
    'binary-tree': 'बाइनरी ट्री एक पदानुक्रमित संरचना है जिसमें हर नोड के अधिकतम दो बच्चे हो सकते हैं—बायाँ और दायाँ।',
    bst: 'बाइनरी सर्च ट्री में छोटे मान बाईं ओर और बड़े मान दाईं ओर रखे जाते हैं, जिससे संतुलित रहने पर खोज अधिक कुशल होती है।',
    avl: 'AVL ट्री एक स्व-संतुलित बाइनरी सर्च ट्री है, जो बाएँ और दाएँ उपवृक्षों की ऊँचाई संतुलित रखने के लिए रोटेशन का उपयोग करता है।',
    general: `${topic} में मुख्य बात इसकी मूल परिभाषा और ${session.subject} में इसके उपयोग को समझना है।`,
  }
  const kannadaExplanations = {
    'binary-tree': 'ಬೈನರಿ ಟ್ರೀ ಒಂದು ಕ್ರಮಾನುಗತ ರಚನೆ. ಪ್ರತಿಯೊಂದು ನೋಡ್‌ಗೆ ಗರಿಷ್ಠ ಎರಡು ಮಕ್ಕಳು—ಎಡ ಮತ್ತು ಬಲ—ಇರಬಹುದು.',
    bst: 'ಬೈನರಿ ಸರ್ಚ್ ಟ್ರೀನಲ್ಲಿ ಚಿಕ್ಕ ಮೌಲ್ಯಗಳು ಎಡಭಾಗದಲ್ಲೂ ದೊಡ್ಡ ಮೌಲ್ಯಗಳು ಬಲಭಾಗದಲ್ಲೂ ಇರುತ್ತವೆ; ಸಮತೋಲನದಲ್ಲಿದ್ದಾಗ ಹುಡುಕಾಟ ಹೆಚ್ಚು ಪರಿಣಾಮಕಾರಿಯಾಗುತ್ತದೆ.',
    avl: 'AVL ಟ್ರೀ ಸ್ವಯಂ-ಸಮತೋಲನ ಹೊಂದಿರುವ ಬೈನರಿ ಸರ್ಚ್ ಟ್ರೀ. ಎಡ ಮತ್ತು ಬಲ ಉಪಟ್ರೀಗಳ ಎತ್ತರವನ್ನು ಸಮೀಪದಲ್ಲಿಡಲು ಇದು ರೋಟೇಷನ್‌ಗಳನ್ನು ಬಳಸುತ್ತದೆ.',
    general: `${topic}ನಲ್ಲಿ ಅದರ ಮೂಲ ವ್ಯಾಖ್ಯಾನ ಮತ್ತು ${session.subject}ನಲ್ಲಿ ಅದರ ಬಳಕೆಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವುದು ಮುಖ್ಯ.`,
  }
  const coreExplanation = session.language === 'Hindi'
    ? hindiExplanations[concept]
    : session.language === 'Kannada'
      ? kannadaExplanations[concept]
      : englishExplanations[concept]

  if (session.language === 'Hindi') {
    const hindiDifficulty = {
      Beginner: 'मैं इसे सरल उदाहरणों से समझाऊँगा।',
      Intermediate: 'मैं मुख्य विचार को उसके उपयोग से जोड़ूँगा।',
      Advanced: 'हम इसके गहरे गुणों और उनके प्रभावों पर ध्यान देंगे।',
    }[session.difficulty]
    const hindiGoal = {
      'Understand the concept': 'अवधारणा को स्पष्ट रूप से समझना',
      'Practice questions': 'अभ्यास प्रश्नों का अभ्यास करना',
      'Exam preparation': 'परीक्षा की तैयारी',
      'Revise quickly': 'मुख्य बिंदुओं का त्वरित पुनरावलोकन',
      'Deep discussion': 'विषय पर गहरी चर्चा',
    }[session.goal]
    const hindiStyle = {
      'Explain step-by-step': 'मैं इसे छोटे चरणों में समझाऊँगा।',
      'Socratic questioning': 'मैं सवालों के ज़रिए आपका मार्गदर्शन करूँगा।',
      'Ask me questions': 'मैं सवाल पूछकर आपकी समझ जाँचूँगा।',
      'Casual discussion': 'हम सहज और बातचीत के अंदाज़ में चर्चा करेंगे।',
      'Rapid-fire': 'हम छोटे और तेज़ सवाल-जवाब करेंगे।',
    }[session.style]
    return `आइए ${session.subject} की "${material}" सामग्री से शुरू करें। ${topic} के बारे में आपके सवाल — “${question}” — का मुख्य विचार यह है: ${coreExplanation} हमारा ध्यान ${hindiGoal} पर रहेगा। ${hindiDifficulty} ${hindiStyle}`
  }
  if (session.language === 'Kannada') {
    const kannadaDifficulty = {
      Beginner: 'ಸರಳ ಉದಾಹರಣೆಗಳಿಂದ ಆರಂಭಿಸುತ್ತೇನೆ.',
      Intermediate: 'ಮುಖ್ಯ ಕಲ್ಪನೆಯನ್ನು ಅದರ ಬಳಕೆಯೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುತ್ತೇನೆ.',
      Advanced: 'ಇದರ ಆಳವಾದ ಗುಣಲಕ್ಷಣಗಳು ಮತ್ತು ಅವುಗಳ ಪರಿಣಾಮಗಳತ್ತ ಗಮನ ಹರಿಸೋಣ.',
    }[session.difficulty]
    const kannadaGoal = {
      'Understand the concept': 'ವಿಷಯವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವುದು',
      'Practice questions': 'ಅಭ್ಯಾಸ ಪ್ರಶ್ನೆಗಳ ಮೂಲಕ ಕಲಿಯುವುದು',
      'Exam preparation': 'ಪರೀಕ್ಷೆಯ ಸಿದ್ಧತೆ',
      'Revise quickly': 'ಮುಖ್ಯ ಅಂಶಗಳ ತ್ವರಿತ ಪುನರವಲೋಕನ',
      'Deep discussion': 'ವಿಷಯದ ಆಳವಾದ ಚರ್ಚೆ',
    }[session.goal]
    const kannadaStyle = {
      'Explain step-by-step': 'ಹಂತ ಹಂತವಾಗಿ ವಿವರಿಸುತ್ತೇನೆ.',
      'Socratic questioning': 'ಪ್ರಶ್ನೆಗಳ ಮೂಲಕ ನಿಮಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತೇನೆ.',
      'Ask me questions': 'ನಿಮ್ಮ ತಿಳುವಳಿಕೆಯನ್ನು ಪ್ರಶ್ನೆಗಳ ಮೂಲಕ ಪರಿಶೀಲಿಸುತ್ತೇನೆ.',
      'Casual discussion': 'ಸಹಜ ಸಂಭಾಷಣೆಯ ರೀತಿಯಲ್ಲಿ ಚರ್ಚಿಸೋಣ.',
      'Rapid-fire': 'ಸಣ್ಣ ಮತ್ತು ತ್ವರಿತ ಪ್ರಶ್ನೋತ್ತರ ಮಾಡೋಣ.',
    }[session.style]
    return `${session.subject} ವಿಷಯದ "${material}" ಆಧರಿಸಿ ನೋಡೋಣ. ${topic} ಕುರಿತು ನಿಮ್ಮ ಪ್ರಶ್ನೆ — “${question}” — ಇದರ ಮುಖ್ಯ ಕಲ್ಪನೆ ಹೀಗಿದೆ: ${coreExplanation} ನಮ್ಮ ಗಮನ ${kannadaGoal} ಮೇಲೆ ಇರುತ್ತದೆ. ${kannadaDifficulty} ${kannadaStyle}`
  }

  const personalization = `We’ll ${goalFocus}. ${difficultyText} ${styleFocus}`
  if (session.mode === 'Rapid Fire') {
    return `Quick answer from your ${session.subject} material, “${material}”: ${coreExplanation} ${personalization} Your turn: what is one example of ${topic} you can think of?`
  }
  if (session.mode === 'Doubt Solver') {
    return `Let’s work through that doubt using “${material}” from ${session.subject}. For ${topic}, start with this core idea: ${coreExplanation} ${personalization} Which part would you like me to clarify first?`
  }

  return `Let’s start with the explanation from your ${session.subject} material, “${material}.” ${coreExplanation} We’re focusing on ${session.topics.join(', ')}. ${personalization}`
}

function VoiceAssistant() {
  const { courses } = useCourses()
  const availableCourses = courses.filter((course) => voiceTutorCourses[course.id])
  const [interactionState, setInteractionState] = useState('idle')
  const [activeMode, setActiveMode] = useState('Explain')
  const [helpful, setHelpful] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [followUp, setFollowUp] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [selectedTopicNames, setSelectedTopicNames] = useState([])
  const [goal, setGoal] = useState(learningGoals[0])
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [style, setStyle] = useState(conversationStyles[0])
  const [language, setLanguage] = useState('English')
  const [activeSession, setActiveSession] = useState(null)
  const [recentSession, setRecentSession] = useState(initialRecentSession)
  const [messages, setMessages] = useState(initialMessages)
  const [streamingText, setStreamingText] = useState('')
  const [error, setError] = useState('')

  const selectedCourse = availableCourses.find((course) => course.id === subjectId)
  const availableTopics = selectedCourse ? voiceTutorCourses[selectedCourse.id]?.topics || [] : []
  const selectedTopics = availableTopics.filter((topic) => selectedTopicNames.includes(topic.topic))
  const relevantMaterials = [...new Set(selectedTopics.flatMap((topic) => topic.materials))]
  const displayedMaterials = relevantMaterials.slice(0, 4)

  const sessionRef = useRef(null)

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      sessionRef.current?.disconnect()
    }
  }, [])

  function askAssistant(question) {
    if (!question || !sessionRef.current) return
    sessionRef.current.sendMessage(question)
  }

  function handleMicrophoneClick() {
    const session = sessionRef.current
    if (!session) return
    
    // If AI is speaking, stop it
    if (session.isSpeaking) {
      session.stopSpeaking()
      return
    }
    
    if (session.isListening) {
      session.stopListening()
    } else {
      session.startListening()
    }
  }

  function handleSubjectChange(event) {
    setSubjectId(event.target.value)
    setSelectedTopicNames([])
  }

  function toggleTopic(topicName) {
    setSelectedTopicNames((current) =>
      current.includes(topicName)
        ? current.filter((topic) => topic !== topicName)
        : [...current, topicName],
    )
  }

  function startSession() {
    if (!selectedCourse || selectedTopics.length === 0) return
    const sessionConfig = {
      subject: selectedCourse.name,
      subjectId: selectedCourse.id,
      topics: selectedTopics.map((topic) => topic.topic),
      materials: relevantMaterials,
      goal,
      difficulty,
      style,
      language,
      mode: activeMode,
    }
    const firstTopic = sessionConfig.topics[0]
    setActiveSession(sessionConfig)
    setRecentSession(sessionConfig)
    
    setMessages([{ role: 'student', speaker: 'You', message: `What should I know about ${firstTopic}?` }])
    setStreamingText('')
    setError('')
    setHelpful(null)
    setIsPlaying(false)
    setInteractionState('processing')
    
    if (sessionRef.current) {
      sessionRef.current.disconnect()
      sessionRef.current = null
    }
    
    const session = new VoiceSession({
      role: 'student',
      userId: 'student-1',
      context: sessionConfig,
      onReady: (data) => {
        if (data.greeting) {
          setMessages((prev) => [...prev, { role: 'tutor', speaker: 'Agnes', message: data.greeting }])
          session.speak(data.greeting)
        } else {
          const fallbackAns = buildTutorResponse(`What should I know about ${firstTopic}?`, sessionConfig)
          setMessages((prev) => [...prev, { role: 'tutor', speaker: 'Agnes', message: fallbackAns }])
          session.speak(fallbackAns)
        }
        setInteractionState('idle')
      },
      onStatus: (s) => {
        if (s === 'listening') setInteractionState('listening')
        else if (s === 'processing') setInteractionState('processing')
        else if (s === 'idle') setInteractionState('idle')
      },
      onTranscript: (data) => {
        if (data.sender === 'assistant') {
          setStreamingText('')
          setMessages((prev) => [...prev, { role: 'tutor', speaker: 'Agnes', message: data.text }])
          session.speak(data.text)
        } else if (data.sender === 'user') {
          setMessages((prev) => [...prev, { role: 'student', speaker: 'You', message: data.text }])
        }
      },
      onToken: (token) => {
        setStreamingText((prev) => prev + token)
      },
      onError: (msg) => {
        setInteractionState('idle')
        setError(msg)
      },
      onSpeakingChange: (speaking) => {
        setIsSpeaking(speaking)
        if (speaking) setInteractionState('speaking')
      },
    })
    
    sessionRef.current = session
    session.connect()
  }

  function handleFollowUp(event) {
    event.preventDefault()
    const question = followUp.trim()
    if (!question || !activeSession) return
    setFollowUp('')
    askAssistant(question)
  }

  function handleModeChange(modeName) {
    setActiveMode(modeName)
    setActiveSession((session) => session ? { ...session, mode: modeName } : session)
  }

  function changeTopics() {
    setActiveSession(null)
    setInteractionState('idle')
    setFollowUp('')
  }

  return (
    <div className="voice-page">
      <header className="voice-page-header">
        <div>
          <span className="voice-page-eyebrow">YOUR AI LEARNING COMPANION</span>
          <h1>Agnes</h1>
          <p>Learn by talking, asking and explaining.</p>
        </div>
        <div className="voice-availability">
          <span aria-hidden="true" />
          Agnes is ready
        </div>
      </header>

      <section aria-labelledby="voice-setup-title" className={`voice-setup-card${activeSession ? ' has-active-session' : ''}`}>
        <div className="voice-setup-heading">
          <div>
            <span className="voice-section-eyebrow">{activeSession ? 'CURRENT SESSION' : 'PERSONALIZE YOUR SESSION'}</span>
            <h2 id="voice-setup-title">{activeSession ? activeSession.subject : 'What do you want to learn?'}</h2>
            <p>
              {activeSession
                ? `${activeSession.topics.join(' • ')} · ${activeSession.difficulty} · ${activeSession.mode}`
                : "Choose a subject and one or more topics. I'll use your learning materials to guide the conversation."}
            </p>
          </div>
          {activeSession && (
            <button className="voice-change-topics" onClick={changeTopics} type="button">
              Change topics
            </button>
          )}
        </div>

        {!activeSession && (
          <>
            <div className="voice-setup-grid">
              <div className="voice-setup-column">
                <label className="voice-field-label" htmlFor="voice-subject">Subject</label>
                <select id="voice-subject" className="voice-select" onChange={handleSubjectChange} value={subjectId}>
                  <option value="">Select Subject</option>
                  {availableCourses.map((course) => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>

                {selectedCourse && (
                  <div className="voice-topic-picker">
                    <div className="voice-topic-heading">
                      <span className="voice-field-label">Choose topics</span>
                      <div>
                        <button
                          disabled={availableTopics.length === 0}
                          onClick={() => setSelectedTopicNames(availableTopics.map((topic) => topic.topic))}
                          type="button"
                        >
                          Select all
                        </button>
                        <button onClick={() => setSelectedTopicNames([])} type="button">Clear all</button>
                      </div>
                    </div>
                    {selectedTopicNames.length > 0 && (
                      <div aria-label="Selected topics" className="voice-selected-topics">
                        {selectedTopics.map((topic) => (
                          <button key={topic.topic} onClick={() => toggleTopic(topic.topic)} type="button">
                            {topic.topic} <span aria-hidden="true">×</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div aria-label="Available topics" className="voice-topic-chips">
                      {availableTopics.map((topic) => {
                        const isSelected = selectedTopicNames.includes(topic.topic)
                        return (
                          <button
                            aria-pressed={isSelected}
                            className={isSelected ? 'is-selected' : ''}
                            key={topic.topic}
                            onClick={() => toggleTopic(topic.topic)}
                            type="button"
                          >
                            {isSelected && <span aria-hidden="true">✓</span>}
                            {topic.topic}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {!selectedCourse && (
                  <div className="voice-topic-prompt">Select a subject to see its topics.</div>
                )}
              </div>

              <div className="voice-setup-column">
                <span className="voice-field-label">How should I teach you?</span>
                <div className="voice-preferences-grid">
                  <label>
                    <span>Learning goal</span>
                    <select className="voice-select" onChange={(event) => setGoal(event.target.value)} value={goal}>
                      {learningGoals.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Difficulty</span>
                    <select className="voice-select" onChange={(event) => setDifficulty(event.target.value)} value={difficulty}>
                      {difficulties.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Conversation style</span>
                    <select className="voice-select" onChange={(event) => setStyle(event.target.value)} value={style}>
                      {conversationStyles.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Language</span>
                    <select className="voice-select" onChange={(event) => setLanguage(event.target.value)} value={language}>
                      {languages.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                </div>

                <div className="voice-materials-panel">
                  <div className="voice-materials-heading">
                    <span aria-hidden="true">📚</span>
                    <div>
                      <strong>Learning from your materials</strong>
                      <small>
                        {selectedTopics.length === 0
                          ? 'Choose topics to find relevant materials'
                          : `${relevantMaterials.length} ${relevantMaterials.length === 1 ? 'material' : 'materials'} available`}
                      </small>
                    </div>
                  </div>
                  {displayedMaterials.length > 0 && (
                    <ul>
                      {displayedMaterials.map((material) => <li key={material}>{material}</li>)}
                      {relevantMaterials.length > displayedMaterials.length && (
                        <li>And {relevantMaterials.length - displayedMaterials.length} more relevant materials</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="voice-start-row">
              <button
                className="voice-start-button"
                disabled={!selectedCourse || selectedTopics.length === 0}
                onClick={startSession}
                type="button"
              >
                Start Voice Session <span aria-hidden="true">🎙</span>
              </button>
              {!selectedCourse || selectedTopics.length === 0
                ? <span>Select a subject and at least one topic to begin.</span>
                : <span>{selectedTopics.length} {selectedTopics.length === 1 ? 'topic' : 'topics'} selected</span>}
            </div>
          </>
        )}
      </section>

      <section aria-label="Voice interaction" className={`voice-stage voice-stage-${interactionState}${activeSession ? ' has-session-context' : ''}`}>
        <div aria-hidden="true" className="voice-listening-rings">
          <span />
          <span />
          <span />
        </div>
        {activeSession && (
          <div className="voice-stage-context">
            <strong>{activeSession.subject}</strong>
            <span>{activeSession.topics.join(' • ')}</span>
            <small>{activeSession.difficulty} · {activeSession.style}</small>
          </div>
        )}
        {isSpeaking ? (
          <button
            aria-label="Stop Agnes from speaking"
            className="microphone-button microphone-speaking"
            onClick={() => sessionRef.current?.stopSpeaking()}
            type="button"
          >
            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" style={{width: '24px', height: '24px'}}>
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            aria-label={interactionState === 'listening' ? 'Stop listening' : 'Start speaking'}
            aria-pressed={interactionState === 'listening'}
            className={`microphone-button microphone-${interactionState}`}
            disabled={!activeSession || interactionState === 'processing'}
            onClick={handleMicrophoneClick}
            type="button"
          >
            <MicrophoneIcon />
          </button>
        )}
        <div aria-live="polite" className="voice-state-copy">
          <strong>{stateLabels[interactionState]}</strong>
          <span>
            {!activeSession
              ? 'Choose a subject and topics to begin your session'
              : interactionState === 'listening'
                ? 'This is a visual demo — no audio is recorded.'
                : interactionState === 'processing'
                  ? 'Preparing a sample tutor response'
                  : interactionState === 'response'
                    ? 'Mock conversation ready'
                    : 'Your voice interaction will be simulated'}
          </span>
        </div>
        <div className="voice-waveform" aria-hidden="true">
          {[14, 22, 31, 18, 37, 24, 42, 21, 32, 17, 27, 13, 22, 35, 19, 29, 15].map((height, index) => (
            <i key={`${height}-${index}`} style={{ '--bar-height': `${height}px` }} />
          ))}
        </div>
      </section>

      <div className="voice-content-grid">
        <section aria-labelledby="conversation-title" className="voice-conversation-card">
          <div className="voice-section-heading">
            <div>
              <span className="voice-section-eyebrow">RECENT SESSION</span>
              <h2 id="conversation-title">Your conversation</h2>
              <div className="voice-recent-context">
                <strong>{recentSession.subject}</strong>
                <span>{recentSession.topics.join(' • ')}</span>
              </div>
            </div>
            <span className="conversation-live-badge">
              <i /> Mock session
            </span>
          </div>

          <div aria-live="polite" className="conversation-thread">
            {messages.map((message, index) => (
              <ConversationMessage
                helpful={helpful}
                isPlaying={isPlaying}
                key={`${message.role}-${index}`}
                message={message}
                onHelpful={setHelpful}
                onPlay={() => sessionRef.current?.speak(message.message)}
              />
            ))}
            {streamingText && (
              <article className="conversation-message message-tutor">
                <div aria-hidden="true" className="message-avatar tutor-avatar">✦</div>
                <div className="message-content">
                  <div className="message-speaker">
                    Agnes
                    <span className="ai-badge">AGNES AI</span>
                  </div>
                  <p>
                    {streamingText}
                    <span className="vaw-cursor" style={{ marginLeft: "4px", display: "inline-block", width: "8px", height: "1em", backgroundColor: "currentColor", animation: "blink 1s step-end infinite" }} />
                  </p>
                </div>
              </article>
            )}
            {error && (
              <article className="conversation-message message-tutor">
                <div aria-hidden="true" className="message-avatar tutor-avatar">✦</div>
                <div className="message-content">
                  <p style={{color: 'var(--color-danger)'}}><strong>Error:</strong> {error}</p>
                </div>
              </article>
            )}
            {interactionState === 'listening' && (
              <article className="conversation-message message-student">
                <div aria-hidden="true" className="message-avatar">S</div>
                <div className="message-content">
                  <p><em>Listening...</em></p>
                </div>
              </article>
            )}
          </div>

          <form className="follow-up-form" onSubmit={handleFollowUp}>
            <label className="visually-hidden" htmlFor="voice-follow-up">Ask a follow-up question</label>
            <input
              disabled={!activeSession}
              id="voice-follow-up"
              onChange={(event) => setFollowUp(event.target.value)}
              placeholder={activeSession ? 'Ask a follow-up question...' : 'Start a voice session to ask a question'}
              value={followUp}
            />
            <button disabled={!activeSession} type="submit">
              Ask follow-up <span aria-hidden="true">→</span>
            </button>
          </form>
        </section>

        <aside aria-label="Voice tutor modes" className="voice-modes-card">
          <div className="voice-section-heading">
            <div>
              <span className="voice-section-eyebrow">MAKE IT YOURS</span>
              <h2>Choose a voice mode</h2>
            </div>
          </div>
          <div className="voice-mode-list">
            {voiceModes.map((mode) => (
              <button
                aria-pressed={activeMode === mode.name}
                className={`voice-mode-option${activeMode === mode.name ? ' is-active' : ''}`}
                key={mode.name}
                onClick={() => handleModeChange(mode.name)}
                type="button"
              >
                <span aria-hidden="true" className="voice-mode-icon">{mode.icon}</span>
                <span className="voice-mode-copy">
                  <strong>{mode.name}</strong>
                  <small>{mode.description}</small>
                </span>
                <span aria-hidden="true" className="voice-mode-chevron">›</span>
              </button>
            ))}
          </div>
          <div className="active-mode-note">
            <span aria-hidden="true">✦</span>
            <p>
              <strong>{activeMode === 'Viva Mode' ? activeMode : `${activeMode} mode`}</strong>
              {' '}{activeMode === 'Rapid Fire'
                ? 'uses short questions and quick answers.'
                : activeMode === 'Doubt Solver'
                  ? 'focuses on your specific questions.'
                  : activeMode === 'Viva Mode'
                    ? 'helps you practice explaining your thinking.'
                    : 'focuses on guided explanations.'}
              {activeSession ? ' It is active for this session.' : ' It is selected for your next session.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default VoiceAssistant
