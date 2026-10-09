import { useMemo, useState } from 'react'
import ProgressBar from '../components/ProgressBar.jsx'
import { flashcards, subjects } from '../data/mockData.js'
import './Flashcards.css'

function Flashcard({ card, isFlipped, onFlip }) {
  return (
    <button
      aria-label={isFlipped ? 'Flashcard answer. Click to see question.' : 'Flashcard question. Click to reveal answer.'}
      aria-pressed={isFlipped}
      className={`flashcard-flipper${isFlipped ? ' is-flipped' : ''}`}
      onClick={onFlip}
      type="button"
    >
      <span className="flashcard-inner">
        <span aria-hidden="true" className="flashcard-face flashcard-front">
          <span className="flashcard-face-top">
            <span className="flashcard-face-label">QUESTION</span>
            <span className="flashcard-topic-pill">{card.topic}</span>
          </span>
          <span className="flashcard-prompt">{card.front}</span>
          <span className="flashcard-hint">
            <span aria-hidden="true">↻</span> Click to reveal answer
          </span>
        </span>
        <span aria-hidden="true" className="flashcard-face flashcard-back">
          <span className="flashcard-face-top">
            <span className="flashcard-face-label">ANSWER</span>
            <span className="flashcard-answer-mark">✓</span>
          </span>
          <span className="flashcard-answer">{card.back}</span>
          <span className="flashcard-hint">Click to see question</span>
        </span>
      </span>
    </button>
  )
}

function FlashcardSummary({ total, knownCount, unknownCount, remaining }) {
  return (
    <aside aria-label="Study progress summary" className="flashcard-summary">
      <div className="flashcard-summary-heading">
        <span aria-hidden="true">✦</span>
        <div>
          <span className="flashcard-eyebrow">YOUR SESSION</span>
          <h2>Progress summary</h2>
        </div>
      </div>
      <div className="flashcard-summary-progress">
        <ProgressBar label="Cards reviewed" value={total - remaining} max={total || 1} />
      </div>
      <div className="flashcard-summary-stats">
        <div className="summary-stat">
          <span className="summary-stat-dot summary-known-dot" />
          <span>Known</span>
          <strong>{knownCount}</strong>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-dot summary-unknown-dot" />
          <span>Still learning</span>
          <strong>{unknownCount}</strong>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-dot summary-remaining-dot" />
          <span>Remaining</span>
          <strong>{remaining}</strong>
        </div>
      </div>
      <div className="flashcard-total-note">
        <span>{total}</span> cards in this deck
      </div>
    </aside>
  )
}

function Flashcards() {
  const [selectedSubjectId, setSelectedSubjectId] = useState('data-structures')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [knownIds, setKnownIds] = useState([])
  const [unknownIds, setUnknownIds] = useState([])

  const availableSubjects = useMemo(() => {
    const subjectIds = new Set(flashcards.map((card) => card.subjectId))
    return subjects.filter((subject) => subjectIds.has(subject.id))
  }, [])

  const deckTopics = useMemo(
    () => [...new Set(
      flashcards
        .filter((card) => card.subjectId === selectedSubjectId)
        .map((card) => card.topic),
    )],
    [selectedSubjectId],
  )

  const deck = useMemo(
    () => flashcards.filter((card) =>
      card.subjectId === selectedSubjectId &&
      (selectedTopic === 'all' || card.topic === selectedTopic),
    ),
    [selectedSubjectId, selectedTopic],
  )

  const knownCount = knownIds.length
  const unknownCount = unknownIds.length
  const remaining = Math.max(deck.length - knownCount - unknownCount, 0)
  const card = deck[currentIndex]
  const subject = subjects.find((item) => item.id === selectedSubjectId)

  function resetDeck(subjectId = selectedSubjectId, topic = selectedTopic) {
    setSelectedSubjectId(subjectId)
    setSelectedTopic(topic)
    setCurrentIndex(0)
    setIsFlipped(false)
    setKnownIds([])
    setUnknownIds([])
  }

  function rateCard(known) {
    if (!card) return

    const nextKnown = known ? [...knownIds, card.id] : knownIds
    const nextUnknown = known ? unknownIds : [...unknownIds, card.id]
    const reviewedIds = new Set([...nextKnown, ...nextUnknown])
    const nextIndex = deck.findIndex((item) => !reviewedIds.has(item.id))

    setKnownIds(nextKnown)
    setUnknownIds(nextUnknown)
    setIsFlipped(false)
    if (nextIndex !== -1) setCurrentIndex(nextIndex)
  }

  return (
    <div className="flashcards-page">
      <header className="flashcards-header">
        <div>
          <span className="flashcard-eyebrow">ACTIVE RECALL</span>
          <h1>Flashcards</h1>
          <p>A quick review today makes concepts stick tomorrow.</p>
        </div>
        <div className="flashcard-session-tag">
          <span aria-hidden="true">✦</span> Study session
        </div>
      </header>

      <section aria-label="Select a flashcard deck" className="flashcard-selectors">
        <label className="flashcard-select-field">
          <span>Subject</span>
          <select
            aria-label="Select subject"
            onChange={(event) => resetDeck(event.target.value, 'all')}
            value={selectedSubjectId}
          >
            {availableSubjects.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <label className="flashcard-select-field">
          <span>Topic</span>
          <select
            aria-label="Select topic"
            onChange={(event) => resetDeck(selectedSubjectId, event.target.value)}
            value={selectedTopic}
          >
            <option value="all">All topics</option>
            {deckTopics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
          </select>
        </label>
        <div aria-live="polite" className="cards-remaining">
          <span aria-hidden="true">▤</span>
          <span><strong>{remaining}</strong> cards remaining</span>
        </div>
      </section>

      <div className="flashcards-layout">
        <main className="flashcards-study-area">
          <div className="flashcards-progress-row">
            <span>{subject?.name || 'Flashcards'}{selectedTopic !== 'all' ? ` / ${selectedTopic}` : ''}</span>
            <strong>{deck.length === 0 ? 0 : Math.min(currentIndex + 1, deck.length)} <span>/ {deck.length}</span></strong>
          </div>
          <ProgressBar label="Deck progress" value={deck.length - remaining} max={deck.length || 1} />

          {card && remaining > 0 ? (
            <>
              <div className="flashcard-stage">
                <Flashcard
                  card={card}
                  isFlipped={isFlipped}
                  onFlip={() => setIsFlipped((flipped) => !flipped)}
                />
              </div>
              <p className="flashcard-instruction">
                <span aria-hidden="true">↻</span> Select the card to flip it
              </p>
              <div className="flashcard-rating-actions">
                <button
                  className="flashcard-rating-button rating-unknown"
                  disabled={!isFlipped}
                  onClick={() => rateCard(false)}
                  type="button"
                >
                  <span aria-hidden="true">✕</span> Don&apos;t Know
                </button>
                <button
                  className="flashcard-rating-button rating-known"
                  disabled={!isFlipped}
                  onClick={() => rateCard(true)}
                  type="button"
                >
                  <span aria-hidden="true">✓</span> Know
                </button>
              </div>
              {!isFlipped && <p className="rating-hint">Flip the card to choose how well you knew it.</p>}
            </>
          ) : (
            <div className="flashcards-complete">
              <span aria-hidden="true">🎉</span>
              <h2>Deck complete</h2>
              <p>You reviewed all {deck.length} {deck.length === 1 ? 'card' : 'cards'} in this selection.</p>
              <button className="flashcard-restart-button" onClick={() => resetDeck()} type="button">
                Start again
              </button>
            </div>
          )}
        </main>

        <FlashcardSummary
          knownCount={knownCount}
          remaining={remaining}
          total={deck.length}
          unknownCount={unknownCount}
        />
      </div>
    </div>
  )
}

export default Flashcards
