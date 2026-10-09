# API Contract

## General Rules
- Base Path: `/api/v1`
- Response Envelope: `{ "data": ..., "meta": {}, "error": null }`
- Error Envelope: `{ "data": null, "error": { "code": string, "message": string } }`
- Long Operations: Return HTTP 202 with `{ "job_id": "uuid" }`. 
  - Check status: `GET /jobs/{id}`
  - Stream events: `GET /jobs/{id}/events` (SSE)

## Auth
- `POST /auth/login` { email, password }
- `POST /auth/demo-login` { "role": "learner" | "educator" } -> Returns token (cookie/local)
- `POST /auth/logout`
- `GET /auth/me` -> { id, email, role, display_name, ... }
- `PATCH /me/profile` -> Updates settings/preferences.

## Learner Endpoints

### Dashboard & Navigation
- `GET /learner/dashboard`
  - Returns: `{ "user": {"name"}, "stats": {"progress", "streak"}, "subjects": [], "due_tasks": [], "quick_actions": [], "learning_modes": [] }`
- `GET /subjects`
  - Returns: Array of Subjects `[{ "id", "name", "enrolled": bool, "progress", ... }]`
- `POST /subjects/{id}/enroll`
- `GET /subjects/{id}`
  - Returns: Subject detail with `topics` array and `estimatedRemainingMinutes`.

### Learning Content
- `GET /learn/{subject_id}/{topic_id}`
  - Returns: Topic `{ "id", "title", "blocks": [] }`
- `POST /learn/{subject_id}/{topic_id}/complete`
- `POST /learn/{subject_id}/{topic_id}/quiz/submit`
  - Body: `{ "quiz_id", "answers": [{ "item_id", "answer" }] }`
  - Returns: Scores and explanations.

### Tasks & Calendar
- `GET /learner/tasks`
  - Returns tasks matching dashboard shape + `weight_percent`, `score`, `plan_item_id`.
- `POST /learner/tasks`
  - Body: `{ title, subject_id?, due_at, type? }`
- `PATCH /learner/tasks/{id}`
- `DELETE /learner/tasks/{id}`
- `GET /tasks/{id}`
- `POST /tasks/{id}/submit`
- `GET /learner/calendar?from=...&to=...`
  - Returns: `[{ id, title, due_at, type, subject_id, source }]`

### Progress & Flashcards
- `GET /learner/progress`
  - Returns: `{ "overall_understanding", "skill_areas", "stats", "topic_mastery", "insight" }`
- `GET /flashcards/session?subject_id&topic_id`
  - Returns: `{ session_id, cards: [{ id, front, back, ... }], total, remaining }`
- `POST /flashcards/review`
  - Body: `{ card_id, known: bool, session_id }`
- `GET /flashcards/session/{id}/summary`

### Exam Prep
- `GET /exam/overview?subject_id`
  - Returns: `{ "practice_test", "readiness", "topic_accuracy", "last_minute_revision", "recommendation" }`
- `POST /exam/generate`
  - Body: `{ subject_id, topic_ids?, questions, minutes, difficulty, mode? }`
- `POST /exam/{id}/submit`
- `GET /exam/revision/{section_id}?subject_id`

### Voice
- `GET /voice/options` -> `{ goals, difficulties, styles, languages, modes }`
- `GET /voice/status` -> `{ ready: bool, local: "up|down", online: "up|down" }`
- `POST /voice/turn` (SSE)
  - Body: `{ text, subject_id, topic_id, goal, mode, difficulty?, style?, language?, session_id? }`

## Educator Endpoints

### Classes & Dashboard
- `GET /educator/classes`
- `GET /educator/dashboard?class_id`
  - Returns: `{ kpis, alerts, next_best_actions, intervention_impact, paths }`
- `GET /educator/analytics?class_id`
- `GET /educator/knowledge-graph?class_id&learner_id?`

### Students & Interventions
- `GET /educator/students?class_id`
- `GET /educator/students/{id}?class_id`
- `GET /educator/interventions?class_id`
- `GET /educator/interventions/impact?class_id`
- `POST /educator/interventions`
  - Body: `{ learner_id, class_id, type, topic_ids?, note }`
- `GET /educator/next-actions?class_id`
- `PATCH /educator/next-actions/{id}`

### Materials & Paths
- `POST /educator/materials` (Multipart or `{ url }`)
- `GET /educator/materials?class_id`
- `GET /educator/materials/{id}`
- `PATCH /educator/materials/{id}`
- `DELETE /educator/materials/{id}`
- `POST /educator/materials/{id}/process`
- `GET /educator/conflicts?class_id`
- `POST /educator/conflicts/{id}/override`
- `GET /educator/paths?class_id`
- `POST /educator/paths/suggest`
- `PUT /educator/paths`
- `POST /educator/paths/publish`
- `POST /educator/paths/change`
- `POST /educator/paths/change/apply`

### Assignments & Content Drafts
- `GET /educator/assignment-types`
- `GET /educator/assignments?class_id`
- `POST /educator/assignments`
- `POST /educator/assignments/generate`
- `POST /educator/assignments/{id}/distribute`
- `GET /educator/assignments/{id}/submissions`
- `PATCH /educator/assignments/{id}/submissions/{learner_id}`
- `GET /educator/drafts?class_id`
- `PATCH /educator/drafts/{id}`
- `POST /educator/drafts/{id}/approve`
- `POST /educator/drafts/{id}/reject`
- `POST /educator/slides/generate`
- `GET /educator/slides/{id}`

### AI Assistant
- `POST /educator/assistant/chat` (SSE)
  - Body: `{ text, context: { route, class_id, learner_id?, topic_id? }, session_id? }`
- `POST /educator/assistant/insight`
- `POST /educator/assistant/draft`
