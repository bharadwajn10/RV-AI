# RV-AI Unified Platform

The RV-AI Unified Platform is a modern, responsive web application that provides dual learning and teaching dashboards (Student and Educator). Its flagship feature is **Agnes**, a highly advanced, role-aware Voice AI Assistant that operates in real-time.

## 🚀 The Agnes Voice AI Feature

Agnes is a conversational AI companion embedded directly into the platform. Depending on who is logged in, Agnes adapts her persona:
- **For Students:** She acts as an empathetic, adaptive tutor who explains complex topics, offers rapid-fire quizzes, and helps solve doubts.
- **For Educators:** She acts as a Teaching Assistant, providing insights on class analytics, summarizing student performance, and helping draft assignments.

### 🎙️ Key Voice Features
- **Real-Time Voice Sessions:** Start a voice session and speak naturally to the AI.
- **Barge-In Capabilities:** Interrupt the AI while she is speaking if you have a doubt or want to change the subject.
- **Zero-Ghosting Architecture:** Seamlessly navigate between pages. Active speech streams and WebSockets are instantly destroyed on unmount to prevent ghost voices or overlapping audio.
- **Token Streaming:** Watch the AI's response type out in real-time before the audio even finishes generating.
- **Intelligent Fallbacks & Retries:** Built-in resilience against network timeouts and rate limits to ensure a consistent experience.

---

## 🏗️ Architecture & Workflow

The voice engine uses a hybrid architecture, combining the real-time capabilities of WebSockets with the reliability of REST APIs for heavy media processing.

### 1. The Speech-to-Text (STT) Pipeline
1. The user clicks the microphone button on the frontend.
2. The browser's native `window.SpeechRecognition` API begins continuous listening.
3. As the user speaks, interim transcripts are generated.
4. A **2-second silence debouncer** (`SILENCE_TIMEOUT_MS`) detects when the user has finished their thought.
5. The recognition engine stops, capturing the final transcript, and sends the text string to the backend via a WebSocket connection.

### 2. The Brain (LLM) Pipeline
1. The FastAPI backend receives the transcript over the active WebSocket.
2. The backend determines the user's role (Student or Educator) and applies the corresponding heavily-engineered System Prompt.
3. The query is routed to the Agnes AI / LLM (via an OpenAI-compatible client).
4. The LLM's response is **streamed** token-by-token back to the React frontend over the WebSocket, creating a low-latency visual typing effect.

### 3. The Text-to-Speech (TTS) Pipeline
1. Once the LLM completes the response, the frontend takes the full text and makes a `POST` request to the backend's `/tts` REST endpoint.
2. The FastAPI backend forwards this text to the **ElevenLabs API** (using the ultra-fast `eleven_turbo_v2_5` model).
3. **Resilience Layer:** If ElevenLabs returns a Rate Limit (`429`) or Server Error (`500+`), the backend intercepts it, pauses briefly, and intelligently retries the request up to 3 times.
4. The generated MP3 audio stream is sent back to the frontend.
5. The frontend safely converts the blob into a URL and plays it. A sequence tracker (`_speakSequence`) ensures that if the user navigated away during the generation phase, the audio is silently discarded instead of playing over the new page.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite (for lightning-fast HMR and optimized builds)
- **Routing:** React Router v7
- **Styling:** Vanilla CSS (Custom design system, glassmorphism, responsive grid layouts)
- **State Management:** React Hooks (`useRef`, `useEffect`, `useState`, `useCallback`)
- **Web Speech API:** For zero-latency, zero-cost native browser speech recognition.

### Backend
- **Framework:** FastAPI (Python)
- **Server:** Uvicorn (ASGI)
- **Concurrency:** `asyncio` and WebSockets for real-time bidirectional communication.
- **HTTP Client:** `httpx` for fast, asynchronous API requests.

### AI & Media Services
- **LLM Engine:** Agnes AI (`agnes-2.5-flash`) via an OpenAI-compatible streaming client.
- **Voice Synthesis:** ElevenLabs API for highly realistic, emotive text-to-speech generation.
