/**
 * Voice AI Service — Handles WebSocket connection and browser speech APIs.
 *
 * Provides:
 *  - WebSocket connection to the FastAPI backend (ws://localhost:8000/ws/voice)
 *  - Browser-native SpeechRecognition for microphone capture
 *  - ElevenLabs TTS via backend /tts endpoint
 *  - Always-on microphone with barge-in interruption
 *  - 2-second silence detection for auto-send
 *  - Event-driven callbacks for status, transcripts, errors
 */

const WS_BASE = 'ws://127.0.0.1:8000'
const API_BASE = 'http://127.0.0.1:8000'
const REQUEST_TIMEOUT_MS = 25000
const SILENCE_TIMEOUT_MS = 2000

// ── WebSocket Voice Session ──

export class VoiceSession {
  constructor({ role = 'student', userId = 'anon', context = {}, onStatus, onTranscript, onToken, onError, onReady, onSpeakingChange }) {
    this.role = role
    this.userId = userId
    this.context = context
    this.onStatus = onStatus || (() => {})
    this.onTranscript = onTranscript || (() => {})
    this.onToken = onToken || (() => {})
    this.onError = onError || (() => {})
    this.onReady = onReady || (() => {})
    this.onSpeakingChange = onSpeakingChange || (() => {})
    this.ws = null
    this.recognition = null
    this._isListening = false
    this._isSpeaking = false
    this._bargeInOccurred = false
    this.currentAudio = null
    this.silenceTimeout = null
    this._recognizedText = ''
    this._speakSequence = 0
  }

  /** Connect to the backend WebSocket. */
  connect() {
    const url = `${WS_BASE}/ws/voice?role=${this.role}&userId=${this.userId}`
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      // Send session init handshake
      this.ws.send(JSON.stringify({
        type: 'session_init',
        role: this.role,
        context: {
          currentPath: window.location.pathname,
          timestamp: new Date().toISOString(),
          ...this.context
        },
      }))
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        switch (data.type) {
          case 'session_ready':
            this.onReady(data)
            break
          case 'status_update':
            this.onStatus(data.status)
            break
          case 'transcript':
            this.onTranscript(data)
            break
          case 'token':
            this.onToken(data.text)
            break
          case 'error':
            this.onError(data.message)
            break
          default:
            break
        }
      } catch (err) {
        console.error('Voice WS parse error:', err)
      }
    }

    this.ws.onerror = () => {
      this.onError('Connection to voice backend failed. Is the server running?')
    }

    this.ws.onclose = () => {
      this.onStatus('disconnected')
    }
  }

  /** Send a text message through the WebSocket. */
  sendMessage(text) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'user_message', text }))
    }
  }

  /** Start browser speech recognition (microphone capture).
   *  Always-on: mic stays active so user can interrupt AI at any time.
   *  2-second silence detection auto-sends the recognized text.
   */
  startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      this.onError('Voice input is not supported in this browser. You can still type.')
      return false
    }

    if (this.recognition) {
      // Already listening — don't restart
      return true
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true

    this._recognizedText = ''
    this._bargeInOccurred = false

    recognition.onresult = (event) => {
      this._recognizedText = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim()

      // Barge-in: if AI is speaking and user starts talking, stop AI.
      // Require > 10 chars to avoid minor speaker echo instantly interrupting AI.
      if (this._isSpeaking && this._recognizedText.length > 10) {
        this._performBargeIn()
      }

      // Reset the 2-second silence timer on every speech event
      if (this._recognizedText) {
        if (this.silenceTimeout) clearTimeout(this.silenceTimeout)
        this.silenceTimeout = setTimeout(() => {
          // 2 seconds of silence — auto-send
          this._autoSend()
        }, SILENCE_TIMEOUT_MS)
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        this._isListening = false
        this.recognition = null
        this.onError('Microphone access is blocked. Allow it in your browser settings.')
        this.onStatus('idle')
      } else if (event.error === 'no-speech') {
        // No speech detected — restart listening silently
        // Don't show error, just keep listening
      } else if (event.error === 'aborted') {
        // Intentional stop — do nothing
      } else {
        this.onError("Couldn't hear that clearly. Please try again or type your message.")
        this.onStatus('idle')
      }
    }

    recognition.onend = () => {
      const hadText = !!this._recognizedText
      const wasListening = this._isListening

      // If we had text that wasn't sent yet, send it
      if (hadText && wasListening) {
        const text = this._recognizedText
        this._recognizedText = ''
        if (this.silenceTimeout) clearTimeout(this.silenceTimeout)
        this.sendMessage(text)
      }

      this.recognition = null

      // Auto-restart recognition to keep mic always on (unless explicitly stopped)
      if (wasListening && !this._disconnecting) {
        // Small delay to prevent rapid restarts
        setTimeout(() => {
          if (this._isListening) {
            this._restartRecognition()
          }
        }, 100)
      } else {
        this._isListening = false
        this.onStatus('idle')
      }
    }

    this.recognition = recognition
    this._isListening = true
    this.onStatus('listening')

    try {
      recognition.start()
    } catch {
      this.recognition = null
      this._isListening = false
      this.onError("Couldn't start the microphone. Please try again.")
      this.onStatus('idle')
    }

    return true
  }

  /** Internal: restart recognition for always-on mic behavior */
  _restartRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition || !this._isListening) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true
    this._recognizedText = ''

    recognition.onresult = (event) => {
      this._recognizedText = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim()

      if (this._isSpeaking && this._recognizedText.length > 10) {
        this._performBargeIn()
      }

      if (this._recognizedText) {
        if (this.silenceTimeout) clearTimeout(this.silenceTimeout)
        this.silenceTimeout = setTimeout(() => {
          this._autoSend()
        }, SILENCE_TIMEOUT_MS)
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        this._isListening = false
        this.recognition = null
        this.onError('Microphone access is blocked.')
        this.onStatus('idle')
      }
      // For other errors, let onend handle restart
    }

    recognition.onend = () => {
      const hadText = !!this._recognizedText
      if (hadText && this._isListening) {
        const text = this._recognizedText
        this._recognizedText = ''
        if (this.silenceTimeout) clearTimeout(this.silenceTimeout)
        this.sendMessage(text)
      }
      this.recognition = null
      if (this._isListening && !this._disconnecting) {
        setTimeout(() => {
          if (this._isListening) this._restartRecognition()
        }, 100)
      }
    }

    this.recognition = recognition
    try {
      recognition.start()
    } catch {
      // Failed to restart — will try again via onend
    }
  }

  /** Internal: auto-send recognized text after silence */
  _autoSend() {
    if (!this._recognizedText) return

    if (this.silenceTimeout) clearTimeout(this.silenceTimeout)

    // Stop recognition to clear the buffer.
    // The onend handler will catch this and naturally send the final text exactly once.
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch {
        // ignore
      }
    }
  }

  /** Internal: handle barge-in (user interrupting AI speech) */
  _performBargeIn() {
    if (!this._isSpeaking) return
    this._bargeInOccurred = true
    this.stopSpeaking()
  }

  /** Stop listening. Sets the always-on mic to off. */
  stopListening() {
    this._isListening = false
    if (this.silenceTimeout) clearTimeout(this.silenceTimeout)
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch {
        // ignore
      }
    }
  }

  /** Toggle listening on/off. */
  toggleListening() {
    if (this._isListening) {
      this.stopListening()
    } else {
      this.startListening()
    }
  }

  get isListening() {
    return this._isListening
  }

  get isSpeaking() {
    return this._isSpeaking
  }

  /** Stop AI from speaking immediately. */
  stopSpeaking() {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      URL.revokeObjectURL(this.currentAudio.src)
      this.currentAudio = null
    }
    window.speechSynthesis?.cancel()
    this._isSpeaking = false
    this.onSpeakingChange(false)
  }

  /** Speak text aloud using ElevenLabs via backend. */
  async speak(text) {
    if (!text) return

    this._speakSequence = (this._speakSequence || 0) + 1
    const currentSeq = this._speakSequence

    // Stop any existing audio
    this.stopSpeaking()
    this._isSpeaking = true
    this.onSpeakingChange(true)

    try {
      const response = await fetch(`${API_BASE}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (this._disconnecting || this._speakSequence !== currentSeq) return

      if (!response.ok) {
        throw new Error('TTS failed')
      }

      const blob = await response.blob()
      if (this._disconnecting || this._speakSequence !== currentSeq) return

      const url = URL.createObjectURL(blob)
      this.currentAudio = new Audio(url)

      this.currentAudio.onended = () => {
        this._isSpeaking = false
        this.onSpeakingChange(false)
        URL.revokeObjectURL(url)
        this.currentAudio = null
        // Auto-start listening after AI finishes speaking
        if (!this._isListening && !this._disconnecting) {
          this.startListening()
        }
      }

      this.currentAudio.onerror = () => {
        this._isSpeaking = false
        this.onSpeakingChange(false)
        this.currentAudio = null
      }

      await this.currentAudio.play()

      // Re-enable listening after a short delay so the user can barge-in and interrupt
      setTimeout(() => {
        if (this._isSpeaking && !this._isListening && !this._disconnecting) {
          this.startListening()
        }
      }, 800)

    } catch (err) {
      console.error('Error playing TTS:', err)
      if (this._disconnecting || this._speakSequence !== currentSeq) return

      this._isSpeaking = false
      this.onSpeakingChange(false)
      
      // We removed the browser TTS fallback here so it remains consistent and never uses the robotic voice.
      
      // Re-enable listening after a failure
      setTimeout(() => {
        if (!this._isListening && !this._disconnecting) {
          this.startListening()
        }
      }, 800)
    }
  }

  /** Reset conversation history on the server. */
  reset() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'reset' }))
    }
  }

  /** Tear down the session completely. */
  disconnect() {
    this._disconnecting = true
    this.stopListening()
    this.stopSpeaking()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// ── REST Chat Fallback (for text-only mode) ──

export async function sendChatMessage(message, role = 'student') {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response
  try {
    response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, role }),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw new Error('Voice backend is not reachable. Start the backend and try again.')
  } finally {
    clearTimeout(timeoutId)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('Backend returned an unreadable response.')
  }

  if (!response.ok) {
    throw new Error(data.detail || `Request failed (${response.status}).`)
  }

  return data
}
