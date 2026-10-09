import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import './Settings.css'

const STORAGE_KEY = 'studyspace-learning-preferences'

const defaultPreferences = {
  learningLevel: 'Beginner',
  learningStyle: 'Visual',
  language: 'English',
  explanationSpeed: 50,
  voiceEnabled: true,
  difficulty: 'Adaptive',
}

const learningLevels = [
  { name: 'Beginner', description: 'Start with the foundations' },
  { name: 'Intermediate', description: 'Build on what you know' },
  { name: 'Advanced', description: 'Go deeper into each topic' },
]

const learningStyles = ['Visual', 'Examples', 'Detailed explanations', 'Practice-first']
const difficulties = ['Adaptive', 'Easy', 'Medium', 'Hard']
const languages = ['English', 'Hindi', 'Kannada', 'Other']

function isValidPreferences(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    learningLevels.some(({ name }) => name === value.learningLevel) &&
    learningStyles.includes(value.learningStyle) &&
    languages.includes(value.language) &&
    Number.isInteger(value.explanationSpeed) &&
    value.explanationSpeed >= 0 &&
    value.explanationSpeed <= 100 &&
    typeof value.voiceEnabled === 'boolean' &&
    difficulties.includes(value.difficulty)
  )
}

function loadPreferences() {
  try {
    const storedPreferences = window.localStorage.getItem(STORAGE_KEY)
    if (storedPreferences === null) {
      return { preferences: defaultPreferences, saveStatus: '', storageError: '' }
    }

    const parsedPreferences = JSON.parse(storedPreferences)
    if (!isValidPreferences(parsedPreferences)) {
      return {
        preferences: defaultPreferences,
        saveStatus: '',
        storageError: 'Saved preferences could not be read. Update your choices and save again.',
      }
    }

    return { preferences: parsedPreferences, saveStatus: '', storageError: '' }
  } catch {
    return {
      preferences: defaultPreferences,
      saveStatus: '',
      storageError: 'Saved preferences could not be read. Update your choices and save again.',
    }
  }
}

function ChoiceGroup({ label, name, options, value, onChange, descriptions = false }) {
  return (
    <fieldset className="settings-fieldset">
      <legend>{label}</legend>
      <div className={`settings-choice-grid${descriptions ? ' settings-level-grid' : ''}`}>
        {options.map((option) => {
          const optionName = typeof option === 'string' ? option : option.name
          const description = typeof option === 'string' ? '' : option.description
          return (
            <label
              className={`settings-choice${descriptions ? ' settings-level-choice' : ''}${value === optionName ? ' is-selected' : ''}`}
              key={optionName}
            >
              <input
                checked={value === optionName}
                name={name}
                onChange={() => onChange(optionName)}
                type="radio"
                value={optionName}
              />
              <span className="settings-radio-mark" aria-hidden="true" />
              <span className="settings-choice-copy">
                <strong>{optionName}</strong>
                {description && <small>{description}</small>}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function Settings() {
  const [settings, setSettings] = useState(loadPreferences)
  const { preferences, saveStatus, storageError } = settings

  function updatePreference(key, value) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      preferences: { ...currentSettings.preferences, [key]: value },
      saveStatus: '',
      storageError: '',
    }))
  }

  function savePreferences(event) {
    event.preventDefault()
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
      setSettings((currentSettings) => ({
        ...currentSettings,
        saveStatus: 'Your learning preferences have been saved on this device.',
        storageError: '',
      }))
    } catch {
      setSettings((currentSettings) => ({
        ...currentSettings,
        saveStatus: '',
        storageError: 'Preferences could not be saved. Check your browser storage settings and try again.',
      }))
    }
  }

  return (
    <div className="settings-page">
      <PageHeader
        description="Personalize how Studyspace helps you learn."
        title="Learning Preferences"
      />

      <form className="settings-form" onSubmit={savePreferences}>
        <section aria-labelledby="learning-level-heading" className="settings-section">
          <div className="settings-section-heading">
            <span aria-hidden="true" className="settings-section-icon settings-icon-level">↗</span>
            <div>
              <h2 id="learning-level-heading">Learning Level</h2>
              <p>Choose the level that best matches your experience.</p>
            </div>
          </div>
          <ChoiceGroup
            descriptions
            label="Select your learning level"
            name="learning-level"
            onChange={(value) => updatePreference('learningLevel', value)}
            options={learningLevels}
            value={preferences.learningLevel}
          />
        </section>

        <section aria-labelledby="learning-style-heading" className="settings-section">
          <div className="settings-section-heading">
            <span aria-hidden="true" className="settings-section-icon settings-icon-style">✦</span>
            <div>
              <h2 id="learning-style-heading">Preferred Learning Style</h2>
              <p>We&apos;ll prioritize this approach in your learning experience.</p>
            </div>
          </div>
          <ChoiceGroup
            label="Choose a preferred style"
            name="learning-style"
            onChange={(value) => updatePreference('learningStyle', value)}
            options={learningStyles}
            value={preferences.learningStyle}
          />
        </section>

        <div className="settings-two-column">
          <section aria-labelledby="language-heading" className="settings-section settings-compact-section">
            <div className="settings-section-heading">
              <span aria-hidden="true" className="settings-section-icon settings-icon-language">文</span>
              <div>
                <h2 id="language-heading">Language</h2>
                <p>Choose your preferred language.</p>
              </div>
            </div>
            <label className="settings-select-label" htmlFor="learning-language">Learning language</label>
            <select
              id="learning-language"
              onChange={(event) => updatePreference('language', event.target.value)}
              value={preferences.language}
            >
              {languages.map((language) => <option key={language}>{language}</option>)}
            </select>
          </section>

          <section aria-labelledby="speed-heading" className="settings-section settings-compact-section">
            <div className="settings-section-heading">
              <span aria-hidden="true" className="settings-section-icon settings-icon-speed">≋</span>
              <div>
                <h2 id="speed-heading">Explanation Speed</h2>
                <p>Adjust the pace of spoken explanations.</p>
              </div>
            </div>
            <div className="speed-control">
              <div className="speed-labels">
                <label htmlFor="explanation-speed">Slow</label>
                <output htmlFor="explanation-speed">{preferences.explanationSpeed}%</output>
                <span>Fast</span>
              </div>
              <input
                aria-label="Explanation speed"
                id="explanation-speed"
                max="100"
                min="0"
                onChange={(event) => updatePreference('explanationSpeed', Number(event.target.value))}
                type="range"
                value={preferences.explanationSpeed}
              />
            </div>
          </section>
        </div>

        <section aria-labelledby="voice-heading" className="settings-section settings-inline-section">
          <div className="settings-section-heading">
            <span aria-hidden="true" className="settings-section-icon settings-icon-voice">♫</span>
            <div>
              <h2 id="voice-heading">Voice Assistant</h2>
              <p>Allow voice-based learning controls and responses.</p>
            </div>
          </div>
          <label className="settings-switch">
            <span className="settings-switch-copy">
              <strong>{preferences.voiceEnabled ? 'Enabled' : 'Disabled'}</strong>
              <small>{preferences.voiceEnabled ? 'Voice features are available' : 'Voice features are turned off'}</small>
            </span>
            <input
              checked={preferences.voiceEnabled}
              onChange={(event) => updatePreference('voiceEnabled', event.target.checked)}
              type="checkbox"
            />
            <span aria-hidden="true" className="settings-switch-track" />
          </label>
        </section>

        <section aria-labelledby="difficulty-heading" className="settings-section">
          <div className="settings-section-heading">
            <span aria-hidden="true" className="settings-section-icon settings-icon-difficulty">◈</span>
            <div>
              <h2 id="difficulty-heading">Practice Difficulty</h2>
              <p>Choose how challenging your practice questions should be.</p>
            </div>
          </div>
          <ChoiceGroup
            label="Choose practice difficulty"
            name="practice-difficulty"
            onChange={(value) => updatePreference('difficulty', value)}
            options={difficulties}
            value={preferences.difficulty}
          />
        </section>

        <div className="settings-footer">
          <div aria-live="polite" className={`settings-status${storageError ? ' is-error' : ''}`}>
            {storageError || saveStatus || 'Changes are saved only when you choose Save Preferences.'}
          </div>
          <button className="settings-save-button" type="submit">
            Save Preferences <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default Settings
