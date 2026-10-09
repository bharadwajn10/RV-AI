import { useEffect, useRef, useState } from 'react'
import { learningGames, rapidFireQuestions } from '../data/mockData.js'
import './Games.css'

const ROUND_SECONDS = 45

function GameCard({ game, onPlay }) {
  return (
    <article className={`arcade-game-card arcade-${game.accent}`}>
      <div className="game-card-topline">
        <span aria-hidden="true" className="game-card-icon">{game.icon}</span>
        <span className={`game-availability${game.available ? ' is-ready' : ''}`}>
          <i />
          {game.available ? 'READY TO PLAY' : 'COMING SOON'}
        </span>
      </div>
      <div className="game-card-copy">
        <h2>{game.title}</h2>
        <p>{game.description}</p>
      </div>
      <div className="game-card-details">
        <span className="game-difficulty">{game.difficulty}</span>
        <span className="game-best-score">
          <span aria-hidden="true">🏅</span>
          Best <strong>{game.bestScore}</strong>
        </span>
      </div>
      <button
        className={`game-play-button${game.available ? '' : ' is-coming'}`}
        onClick={() => onPlay(game)}
        type="button"
      >
        {game.available ? 'Play now' : 'Coming soon'}
        <span aria-hidden="true">{game.available ? '→' : '◷'}</span>
      </button>
      <span aria-hidden="true" className="game-card-decoration" />
    </article>
  )
}

function RapidFireRound({ onClose }) {
  const [roundState, setRoundState] = useState('ready')
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const timeLeftRef = useRef(ROUND_SECONDS)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [answerIsCorrect, setAnswerIsCorrect] = useState(false)
  const question = rapidFireQuestions[questionIndex % rapidFireQuestions.length]

  useEffect(() => {
    if (roundState !== 'playing') return undefined

    const intervalId = window.setInterval(() => {
      const nextTime = Math.max(timeLeftRef.current - 1, 0)
      timeLeftRef.current = nextTime
      setTimeLeft(nextTime)
      if (nextTime === 0) setRoundState('finished')
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [roundState])

  useEffect(() => {
    if (roundState !== 'answering') return undefined

    const timeoutId = window.setTimeout(() => {
      setQuestionIndex((index) => index + 1)
      setSelectedAnswer('')
      setRoundState('playing')
    }, 650)

    return () => window.clearTimeout(timeoutId)
  }, [roundState])

  function startRound() {
    timeLeftRef.current = ROUND_SECONDS
    setTimeLeft(ROUND_SECONDS)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setQuestionIndex(0)
    setSelectedAnswer('')
    setRoundState('playing')
  }

  function submitAnswer(answer) {
    if (roundState !== 'playing') return

    const isCorrect = answer === question.correctAnswer
    setSelectedAnswer(answer)
    setAnswerIsCorrect(isCorrect)
    setScore((currentScore) => currentScore + (isCorrect ? 100 + streak * 10 : 0))
    setStreak((currentStreak) => isCorrect ? currentStreak + 1 : 0)
    if (isCorrect) setBestStreak((currentBest) => Math.max(currentBest, streak + 1))
    setRoundState('answering')
  }

  return (
    <div
      aria-labelledby="rapid-fire-title"
      aria-modal="true"
      className="game-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="dialog"
    >
      <section className="rapid-fire-modal">
        <button
          aria-label="Close game"
          className="game-modal-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>

        {roundState === 'ready' && (
          <div className="rapid-fire-intro">
            <span aria-hidden="true" className="rapid-fire-big-icon">⚡</span>
            <span className="arcade-eyebrow">45 SECOND ROUND</span>
            <h2 id="rapid-fire-title">Ready for Rapid Fire?</h2>
            <p>Answer Data Structures questions as quickly as you can. Correct answers build your score and streak.</p>
            <div className="rapid-fire-rules">
              <span><strong>+100</strong> per correct answer</span>
              <span><strong>Streak bonus</strong> for consecutive answers</span>
            </div>
            <button className="arcade-primary-button" onClick={startRound} type="button">
              Start round <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

        {(roundState === 'playing' || roundState === 'answering') && (
          <div className="rapid-fire-playing">
            <div className="rapid-fire-game-heading">
              <div>
                <span className="arcade-eyebrow">DATA STRUCTURES · {question.topic.toUpperCase()}</span>
                <h2 id="rapid-fire-title">Rapid Fire</h2>
              </div>
              <div className={`rapid-fire-timer${timeLeft <= 10 ? ' is-low' : ''}`}>
                <span aria-hidden="true">◷</span> 00:{String(timeLeft).padStart(2, '0')}
              </div>
            </div>
            <div className="rapid-fire-score-row">
              <span>Score <strong>{score}</strong></span>
              <span>Streak <strong>⚡ {streak}</strong></span>
              <span>Question <strong>{questionIndex + 1}</strong></span>
            </div>
            <div className="rapid-fire-question">
              <span>QUICK THINK</span>
              <h3>{question.question}</h3>
            </div>
            <div className="rapid-fire-answers">
              {question.answers.map((answer, index) => (
                <button
                  className={`rapid-fire-answer${selectedAnswer === answer ? answerIsCorrect ? ' is-correct' : ' is-incorrect' : ''}`}
                  disabled={roundState !== 'playing'}
                  key={answer}
                  onClick={() => submitAnswer(answer)}
                  type="button"
                >
                  <span className="answer-shortcut">{String.fromCharCode(65 + index)}</span>
                  {answer}
                  {selectedAnswer === answer && (
                    <span aria-hidden="true" className="answer-result">
                      {answerIsCorrect ? '✓' : '×'}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p aria-live="polite" className="rapid-fire-feedback">
              {roundState === 'answering'
                ? answerIsCorrect ? 'Correct! Keep the streak going.' : `Not quite — ${question.correctAnswer} is the answer.`
                : 'Choose an answer to keep your round moving.'}
            </p>
          </div>
        )}

        {roundState === 'finished' && (
          <div className="rapid-fire-results">
            <span aria-hidden="true" className="rapid-fire-big-icon">🏁</span>
            <span className="arcade-eyebrow">ROUND COMPLETE</span>
            <h2 id="rapid-fire-title">Nice run!</h2>
            <p>Your time is up. Here’s how you did.</p>
            <div className="rapid-fire-final-score">
              <span>FINAL SCORE</span>
              <strong>{score}</strong>
              <small>Best streak: {bestStreak}</small>
            </div>
            <button className="arcade-primary-button" onClick={startRound} type="button">
              Play again <span aria-hidden="true">↻</span>
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

function Games() {
  const [selectedGame, setSelectedGame] = useState(null)

  return (
    <div className="games-page">
      <header className="arcade-hero">
        <div className="arcade-hero-copy">
          <span className="arcade-eyebrow"><span aria-hidden="true">✦</span> THE STUDY BREAK THAT TEACHES</span>
          <h1>Learning Arcade</h1>
          <p>Power up your knowledge. Play a quick round, practice a concept, and see your skills level up.</p>
          <div className="arcade-hero-note">
            <span aria-hidden="true">🎮</span> Bite-sized games. Real learning momentum.
          </div>
        </div>
        <div aria-hidden="true" className="arcade-hero-art">
          <span className="arcade-art-orbit arcade-art-orbit-one" />
          <span className="arcade-art-orbit arcade-art-orbit-two" />
          <span className="arcade-art-spark arcade-spark-one">✦</span>
          <span className="arcade-art-spark arcade-spark-two">+</span>
          <span className="arcade-art-controller">🎮</span>
          <span className="arcade-art-score">+100</span>
        </div>
      </header>

      <div className="arcade-section-heading">
        <div>
          <span className="arcade-eyebrow">CHOOSE YOUR CHALLENGE</span>
          <h2>Pick a game, start learning</h2>
        </div>
        <span className="arcade-game-count">{learningGames.length} games</span>
      </div>

      <section aria-label="Learning games" className="arcade-games-grid">
        {learningGames.map((game) => (
          <GameCard game={game} key={game.id} onPlay={setSelectedGame} />
        ))}
      </section>

      <aside className="arcade-footer-tip">
        <span aria-hidden="true">💡</span>
        <p><strong>Little tip:</strong> A few fast rounds are a fun way to strengthen what you’ve learned.</p>
        <span className="arcade-footer-decoration" aria-hidden="true">✧</span>
      </aside>

      {selectedGame && (
        selectedGame.available
          ? <RapidFireRound onClose={() => setSelectedGame(null)} />
          : (
            <div
              aria-labelledby="coming-soon-title"
              aria-modal="true"
              className="game-modal-backdrop"
              onClick={(event) => {
                if (event.target === event.currentTarget) setSelectedGame(null)
              }}
              role="dialog"
            >
              <section className="coming-soon-modal">
                <button
                  aria-label="Close dialog"
                  className="game-modal-close"
                  onClick={() => setSelectedGame(null)}
                  type="button"
                >
                  ×
                </button>
                <span aria-hidden="true" className={`game-card-icon arcade-icon-${selectedGame.accent}`}>
                  {selectedGame.icon}
                </span>
                <span className="arcade-eyebrow">IN THE WORKSHOP</span>
                <h2 id="coming-soon-title">{selectedGame.title} is coming soon</h2>
                <p>We’re putting the finishing touches on this challenge. In the meantime, try a Rapid Fire round.</p>
                <button
                  className="arcade-primary-button"
                  onClick={() => setSelectedGame(learningGames[0])}
                  type="button"
                >
                  Play Rapid Fire <span aria-hidden="true">→</span>
                </button>
              </section>
            </div>
          )
      )}
    </div>
  )
}

export default Games
