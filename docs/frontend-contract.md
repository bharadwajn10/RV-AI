# Frontend Contract

## 1. Roles & Navigation

### Learner Role
- **Sidebar:** Dashboard, Subjects, Calendar, Voice assistant, Flashcards, Games, Exam Prep, Progress, Settings
- **Routes:** 
  - `/dashboard`: Lands on Dashboard page.
  - `/subjects`, `/subjects/:subjectId`: Course catalogs and details.
  - `/learn/:subjectId/:topicId`: Content consumption interface.
  - `/tasks/:taskId`: Assignment tracking.
  - `/calendar`: Timetable.
  - `/voice`, `/voice-assistant`: Voice tutor workspace.
  - `/flashcards`: Study decks.
  - `/games`: Gamified learning options.
  - `/exam`: Mock test environment.
  - `/progress`: Analytics view.
  - `/settings`: Preferences.

### Educator Role
- **Sidebar:** Dashboard, Learning Paths, Students, Analytics, Upload Material, Create Assignment, AI Assistant
- **Pages (State-based routing in App):**
  - `Dashboard`: Class overview.
  - `LearningPaths`: Structuring curriculum.
  - `Students`: Class roster.
  - `Analytics`: Cohort performance.
  - `StudyMaterials`: Uploading raw files.
  - `Assignments`: Distributing work.
  - `AIAssistant`: Dedicated copilot interface.

## 2 & 3. Page Data & API Actions

### Learner
- **Dashboard:** 
  - **Data:** `{ "user": {"name": "Alex"}, "progress": 72, "streak": 6 }`, upcoming tasks array. 
  - **Actions:** `+ Add Task`.
- **Subjects & Learn:** 
  - **Data:** `{ "id": "data-structures", "progress": 72, "totalTopics": 25, "blocks": [{"type": "markdown", "body": "..."}] }`. 
  - **Actions:** `Continue`, `Enroll`, `Submit Quiz`, `Mark Complete`.
- **Flashcards:** 
  - **Data:** `{ "cards": [{ "front": "Q", "back": "A" }] }`. 
  - **Actions:** `Start Session`, `Know`, `Don't Know`.
- **Exam Prep:** 
  - **Data:** `{ "readiness": 71, "topic_accuracy": [{"topic": "Trees", "accuracy": 54}] }`. 
  - **Actions:** `Start Exam`, `Practice Topic`.
- **Games:** 
  - **Data:** `{ "games": [{ "name": "Rapid Fire" }] }`. 
  - **Actions:** `Start Game`.
- **Voice:** 
  - **Data:** `{ "subject": "Math", "goals": [], "modes": [] }`. 
  - **Actions:** `Start Session`.

### Educator
- **Dashboard & Analytics:** 
  - **Data:** Cohort averages, alerts array. 
  - **Actions:** `Send Check-in`.
- **Study Materials:** 
  - **Data:** File metadata array. 
  - **Actions:** `Upload`, `Process Content`.
- **Assignments:** 
  - **Data:** `{ "title": "Midterm", "due_date": "ISO", "rubric": {} }`. 
  - **Actions:** `Create Assignment`, `Publish`.
- **Learning Paths:** 
  - **Data:** `{ "topics": [], "modules": [], "order": [] }`. 
  - **Actions:** `Add Module`, `Save Path`.
- **Students:** 
  - **Data:** `{ "studentName": "John", "progress": 45, "gaps": [] }`. 
  - **Actions:** `Intervene`.
- **AI Assistant / Agnes Companion:** 
  - **Actions:** `Generate Insight`, `Draft Content`.

## 4. Streaming & Voice Behaviour
- **Learner Voice:** POSTs `{ text, subject_id, topic_id, goal, mode }` via SSE to stream responses. Needs a continuous text stream back.
- **Educator Agnes:** Sends prompt. Expects streaming text reply or JSON recommended actions.

## 5. Feature Checklist
- Rapid fire: Yes
- Flashcards: Yes
- Exam prep: Yes
- Calendar: Yes
- "+ Add Task": Yes
- Knowledge graph: Yes
- Intervention impact: Yes
- Next best actions: Yes
- Slides or deck: Yes
- Educator conflicts panel: No
- Notifications: No
- Login page: No

## 6. LocalStorage & Fake Data (To Be Replaced)
- **Fake Data:** Both branches heavily rely on `src/data/mockData.js` and hard-coded state arrays for UI presentation. The backend must provide real API endpoints to replace these.
- **LocalStorage:** 
  - `Settings.jsx`: Persists user preferences locally.
  - `TaskContext.jsx`: Persists personal tasks locally.
  - `CourseProvider.jsx`: Persists subject progress and enrollments locally.
  - `VoiceAssistantBubble.jsx`: Saves the most recent session config.
