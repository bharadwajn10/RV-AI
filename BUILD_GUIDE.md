# Final Build Guide: studyspace backend (hackathon)

For: Antigravity (coding agent). This file is complete. Build the backend from it, in the order of section 13. Do not add features that are not in here.

Context: AI track hackathon, problem HR26-AI-01 (Learning Experiences). Review 9 Oct 6:00 pm. Final submission 10 Oct 6:30 am. One developer, one Windows laptop (RTX 4050 6 GB VRAM, 32 GB RAM). Everything must run with simple commands and work in a live demo.

---

## 1. What the product is

- **Learner app** (React 19 + Vite, React Router): Dashboard, Subjects, Learn, Tasks, Calendar, Voice tutor (page and floating bubble), Flashcards, Exam Prep (including Rapid Fire), Progress, Settings.
- **Educator app** (same repo, state-based navigation, no router): Dashboard, Learning Paths, Students, Analytics, Upload Material, Create Assignment, AI Assistant, floating Agnes companion.
- The front end currently runs on `src/data/mockData.js` and localStorage. This backend replaces both.
- Games, achievements, XP and badges do not exist. Notifications and a login page do not exist in the front end.

### The hackathon's three minimum objectives (must be visibly met)

1. Adapt content to learner performance, prior knowledge and preferred style.
2. Predict future learning gaps and redesign the learner's path before they emerge.
3. Resolve conflicting or outdated sources and decide what to trust, autonomously, with an educator override.

Also required by the brief: educators stay in control, can see where understanding is growing or stuck, can tell what comes from their own material, requirements can change without starting over, it works within time, connectivity and cost limits, and saved outputs used as a demo fallback are labelled.

### Hard facts about the model API

Agnes: base URL `https://apihub.agnes-ai.com/v1`, `POST /chat/completions`, model `agnes-3.0-flash`, text and image-URL input only, free plan 10 text requests per minute. Keep the key on the server. Queue requests, back off on rate limits. Speech to text and text to speech are done in the browser.

---

## 2. Scope

### Build for real

- Educator: upload and index materials, learning path (suggest, edit, status, publish), requirement change by text or voice, conflict detection with override, assignment and quiz and test generation with draft review and distribution, slides generation (JSON preview), class dashboard and analytics, students list and detail, interventions, next best actions, knowledge graph, AI assistant (streaming).
- Learner: dashboard, subjects and enrollment, learn page (text, slides, quiz, flashcards), tasks (including personal tasks), calendar, voice tutor (grounded, verified, personalized, streaming), flashcards, exam prep and rapid fire, progress and insight, settings, gap prediction and path replanning.

### Seeded sample data (looks real in the demo, mark as sample)

Weekly trends, study time totals, intervention before and after numbers for the seeded interventions, mastery histories, "common misconceptions" text, and ready-made drafts and lessons saved as fallback (`is_fallback = true`).

### Cut

Games, achievements, XP, levels, badges, learner notifications and inbox, educator private notes, image diagrams, `.pptx` export (only if time remains), mastery landscape, enrichment tracks, voice session history screens, Docker, Redis, job queues, CI, audit logs, token rotation.

---

## 3. Architecture

```
React front end (Vite, port 5173)  --HTTP + SSE-->  FastAPI app (one process, port 8000)
                                                      api/v1  thin routers, call features by name
                                                      personalization/   <- ONLY code that touches the databases
                                                         registry, features/, engines/, agents/, llm/
                                                      user_db/    SQLite file user.db
                                                      course_db/  SQLite file course.db (with FTS5 index)
                                                                 |                         |
                                                       llama-server (Qwen3.5 4B)       Agnes API
                                                       local, port 8081               online
```

Three blocks:

1. **User database** (`user.db`): users, profiles, enrollments, mastery, attempts, progress, tasks, flashcard state, voice sessions, interventions, messages.
2. **Course database** (`course.db`): subjects, topics, materials and chunks (FTS5), plans, approved assignments, quizzes, tests, slide decks, question bank, flashcards, lessons, conflicts, drafts.
3. **Personalization block**: all logic. It is the only layer that imports repositories for both databases. Routers never touch a database.

Rules:
1. Front end isolation. Versioned routes `/api/v1`. Response envelope. Only additive changes inside `v1`. Unknown request fields are ignored. A front-end change must not require a backend change.
2. Every feature is a registered function (section 6).
3. Educator stays in control. Generated assignments, quizzes, tests, slides and paths are drafts until the educator approves or publishes.
4. Cite sources. Generated content carries `source_chunk_ids`. Anything not backed by educator material is marked `external`.
5. All Agnes calls go through one limiter (section 7.3).
6. Never log or return the Agnes key, password hashes or tokens.

### Stack

Python 3.12, FastAPI, uvicorn, Pydantic v2 and pydantic-settings, SQLAlchemy 2.0 with SQLite (WAL mode, two engines), SQLite FTS5, `httpx` (async, streaming) for model calls, `PyJWT` and `passlib` (argon2 or bcrypt), `pypdf`, `python-docx`, `python-pptx` (reading uploaded decks only), `trafilatura`, `pytest`. Background work with FastAPI `BackgroundTasks` or `asyncio.create_task`, with a `jobs` table and SSE progress. Local model: `llama-server` from llama.cpp, Qwen3.5 4B GGUF Q4_K_M, OpenAI-compatible, run natively on Windows.

### Repo layout

```
backend/                        # sibling of frontend/, venv at backend/venv/
  app/
    main.py
    core/            settings.py security.py errors.py envelope.py ids.py sse.py
    api/v1/          auth.py learner.py educator.py voice.py exam.py flashcards.py jobs.py
    schemas/         Pydantic models, written first
    user_db/         models.py repos.py
    course_db/       models.py repos.py fts.py
    personalization/
      registry.py
      features/      learner_*.py educator_*.py voice.py generation.py
      engines/       mastery.py progress.py gaps.py trust.py scheduling.py readiness.py actions.py impact.py
      agents/        generator.py (one agent, several kinds), slides.py
      llm/           router.py local.py agnes.py limiter.py cache.py verifier.py prompts.py
    seed/            seed.py, data/*.json, fallbacks/*.json
  tests/
  scripts/           smoke_agnes.py  bench_local.py  start_local_llm.ps1  run_dev.ps1
  .env.example
```

Import rule, enforced by a test: `api/` imports only `personalization.registry`, `schemas` and `core`. Only `personalization/` imports `user_db` and `course_db`.

---

## 4. Front end integration

### 4.1 Rules

- CORS: allow `http://localhost:5173`. Add a Vite proxy for `/api` to `http://localhost:8000`, or use `VITE_API_URL`.
- Create `frontend/src/api/client.js`: base URL, JSON helper that unwraps `{ data }`, error handling, and an SSE helper for streaming `POST` requests (use `fetch` with a reader, not `EventSource`).
- Replace each `mockData.js` import with an API call, one screen at a time. Do not restyle components.
- There is no login page. Provide `POST /auth/demo-login { role: "learner" | "educator" }` that signs in the seeded users (Alex, and the educator). The front end calls it once on load, based on a `VITE_ROLE` setting, and stores the token in an httpOnly cookie or memory. Also implement `POST /auth/login` and `GET /auth/me`.
- localStorage replacements: `CourseProvider` progress and enrollments move to the backend (`/subjects`, `/subjects/{id}/enroll`, `/learn/.../complete`). `TaskContext` personal tasks move to `/learner/tasks`. `Settings.jsx` preferences move to `PATCH /me/profile`. `VoiceAssistantBubble` last session config may stay in localStorage.
- Response envelope for everything: `{ "data": ..., "meta": {}, "error": null }`. Errors: `{ "data": null, "error": { "code", "message" } }`.
- Return full resources. Field names below are the contract. Add fields freely, never rename them.
- Ids for subjects and topics are readable slugs (`data-structures`, `binary-trees`), stored as text.
- Long operations return `202 { job_id }`. `GET /jobs/{id}` and `GET /jobs/{id}/events` (SSE) report progress.

### 4.2 Learner route map

| Screen | Endpoint |
|---|---|
| Dashboard | `GET /learner/dashboard` |
| Subjects | `GET /subjects`, `POST /subjects/{id}/enroll` |
| Subject detail | `GET /subjects/{id}` |
| Learn | `GET /learn/{subject_id}/{topic_id}`, `POST /learn/{subject_id}/{topic_id}/complete`, `POST /learn/{subject_id}/{topic_id}/quiz/submit` |
| Tasks | `GET /learner/tasks`, `POST /learner/tasks`, `PATCH /learner/tasks/{id}`, `DELETE /learner/tasks/{id}`, `GET /tasks/{id}`, `POST /tasks/{id}/submit` |
| Calendar | `GET /learner/calendar?from&to` |
| Voice tutor and bubble | `GET /voice/options`, `GET /voice/status`, `POST /voice/turn` (SSE) |
| Flashcards | `GET /flashcards/session?subject_id&topic_id`, `POST /flashcards/review`, `GET /flashcards/session/{id}/summary` |
| Exam Prep | `GET /exam/overview?subject_id`, `POST /exam/generate`, `POST /exam/{id}/submit`, `GET /exam/revision/{section_id}?subject_id` |
| Progress | `GET /learner/progress` |
| Settings | `GET /me`, `PATCH /me/profile` |

### 4.3 Educator route map

| Screen | Endpoint |
|---|---|
| Class switcher | `GET /educator/classes` |
| Dashboard | `GET /educator/dashboard?class_id` (KPIs, alerts, next best actions, intervention impact summary, path progress) |
| Analytics | `GET /educator/analytics?class_id`, `GET /educator/knowledge-graph?class_id&learner_id?` |
| Students | `GET /educator/students?class_id`, `GET /educator/students/{learner_id}?class_id`, `POST /educator/interventions` (the Intervene and Send Check-in buttons) |
| Interventions | `GET /educator/interventions?class_id`, `GET /educator/interventions/impact?class_id` |
| Next best actions | `GET /educator/next-actions?class_id`, `PATCH /educator/next-actions/{id}` |
| Upload Material | `POST /educator/materials`, `GET /educator/materials?class_id`, `GET /educator/materials/{id}`, `PATCH /educator/materials/{id}`, `DELETE /educator/materials/{id}`, `POST /educator/materials/{id}/process` |
| Conflicts (new small panel, front end addition) | `GET /educator/conflicts?class_id`, `POST /educator/conflicts/{id}/override` |
| Learning Paths | `GET /educator/paths?class_id`, `POST /educator/paths/suggest`, `PUT /educator/paths`, `PATCH /educator/paths/status`, `POST /educator/paths/publish`, `POST /educator/paths/change`, `POST /educator/paths/change/apply` |
| Create Assignment | `GET /educator/assignment-types`, `GET /educator/assignments?class_id`, `POST /educator/assignments`, `POST /educator/assignments/generate`, `POST /educator/assignments/{id}/distribute`, `GET /educator/assignments/{id}/submissions`, `PATCH /educator/assignments/{id}/submissions/{learner_id}` |
| Drafts | `GET /educator/drafts?class_id`, `PATCH /educator/drafts/{id}`, `POST /educator/drafts/{id}/approve`, `POST /educator/drafts/{id}/reject` |
| Slides | `POST /educator/slides/generate`, `GET /educator/slides/{id}` |
| AI Assistant and companion | `POST /educator/assistant/chat` (SSE), `POST /educator/assistant/insight`, `POST /educator/assistant/draft` |

Two small front-end additions are needed for required features: a conflicts panel in Upload Material, and a "describe a change" box with a microphone button in Learning Paths.

### 4.4 Response shapes the screens need

Exact field names. Add more, do not rename.

**Learner dashboard** `GET /learner/dashboard`
```json
{ "user": { "name": "Alex" }, "stats": { "progress": 72, "streak": 6 },
  "subjects": [ { "id": "data-structures", "name": "Data Structures", "progress": 72, "icon": "tree", "category": "Core" } ],
  "due_tasks": [ { "id", "type": "Assignment|Test|Assessment|Reading|Quiz|Project|Personal", "title",
                   "subject_id", "subject_name", "due_at": "ISO", "status": "todo|doing|done|overdue" } ],
  "quick_actions": [ { "id": "understand|voice|flashcards|rapid_fire", "title", "subtitle", "route" } ],
  "learning_modes": [ { "id": "understand|exam", "title", "subtitle", "route" } ] }
```
Return `due_at` as ISO. The front end formats "Due today", "Tomorrow", "Oct 12". Return the three nearest due tasks, overdue first.

**Subject** `GET /subjects` (list, with `enrolled`) and `GET /subjects/{id}`
```json
{ "id", "name", "category": "Core", "icon", "description", "enrolled": true,
  "progress": 72, "topicsCompleted": 18, "totalTopics": 25, "lastStudiedTopic": "Binary Trees",
  "estimatedRemainingMinutes": 320, "continue_topic_id": "trees",
  "topics": [ { "id", "name", "status": "completed|in_progress|not_started", "difficulty": "Easy|Medium|Hard",
                "est_minutes": 80, "progress_pct": 55 } ] }
```
`progress`, `topicsCompleted`, `totalTopics`, `lastStudiedTopic`, `estimatedRemainingMinutes` are computed (section 6.3), never stored.

**Learn** `GET /learn/{subject_id}/{topic_id}`
```json
{ "id", "subject_id", "title", "status", "est_minutes", "adapted_for": { "reading_level", "depth", "language" },
  "blocks": [ { "type": "markdown", "body", "source_chunk_ids": [], "external": false },
              { "type": "slides", "deck_id", "slides": [ { "title", "bullets": [], "speaker_notes" } ] },
              { "type": "video", "url", "title" },
              { "type": "quiz", "quiz_id", "items": [ { "id", "prompt", "options": [], "kind" } ] },
              { "type": "flashcards", "deck_id" } ] }
```
Quiz items sent to the learner never include the answer. `POST .../quiz/submit` takes `{ quiz_id, answers: [{ item_id, answer }] }` and returns scores and explanations.

**Tasks.** `GET /learner/tasks` returns the same task shape as the dashboard plus `weight_percent`, `score`, `plan_item_id`. Tasks are a view over: plan items, distributed assignments, and `personal_tasks`. `status = overdue` is computed. `POST /learner/tasks` takes `{ title, subject_id?, due_at, type? }` and creates a personal task.

**Calendar** `GET /learner/calendar?from&to` returns `[ { id, title, date/due_at, type, subject_id, source: "plan|assignment|personal" } ]`.

**Voice** (section 9). `GET /voice/options` returns `{ goals, difficulties, styles, languages, modes }`. `POST /voice/turn` body `{ text, subject_id, topic_id, goal, mode, difficulty?, style?, language?, session_id? }`, response SSE.

**Flashcards** `GET /flashcards/session?subject_id&topic_id` returns `{ session_id, cards: [ { id, topic_id, topic_name, front, back } ], total, remaining }`. `POST /flashcards/review` takes `{ card_id, known: true|false, session_id }`.

**Exam overview** `GET /exam/overview?subject_id`
```json
{ "practice_test": { "questions": 30, "minutes": 45, "difficulty": "mixed" },
  "readiness": { "percent": 71, "basis": "recent practice" },
  "topic_accuracy": [ { "topic_id", "topic": "Trees", "name": "Trees", "accuracy": 54, "needs_review": true } ],
  "last_minute_revision": [ { "id": "important_concepts|common_questions|key_definitions|quick_revision", "title", "subtitle", "available": true } ],
  "recommendation": { "title": "Practice Graph Traversal", "reason": "Graph accuracy is at 42%.", "topic_id": "graphs", "actions": ["practice_topic", "start_exam"] } }
```
`POST /exam/generate` body `{ subject_id, topic_ids?, questions: 30, minutes: 45, difficulty: "mixed", mode?: "exam|rapid_fire", seconds?: 60 }`. Questions come from the approved `question_bank` with no model call. If the bank is short, queue generation (Agnes, background) and return a job. Practice exams are labelled `practice` and never count toward grades. Rapid fire uses the same endpoints with `mode: "rapid_fire"`.

**Progress** `GET /learner/progress`
```json
{ "overall_understanding": { "percent": 74, "mastered_share": 0.48 },
  "skill_areas": [ { "id": "concept|application|exam|recall", "label", "percent" } ],
  "stats": { "questions_answered": 248, "concepts_completed": 36, "study_minutes": 1120, "streak_days": 6 },
  "topic_mastery": { "subject_id", "topics": [ { "id", "name", "percent", "focus": false } ] },
  "insight": { "headline", "detail", "recommended": { "label", "route" } } }
```

**Educator dashboard** `GET /educator/dashboard?class_id`
```json
{ "kpis": { "avg_mastery": 63, "active_learners_7d": 21, "at_risk": 4, "completion_rate": 58, "avg_score": 71 },
  "alerts": [ { "id", "learner_id", "title", "detail", "impact": "high|medium|low" } ],
  "next_best_actions": [ { "id", "kind", "priority", "impact", "title", "detail", "learner_id", "topic_id", "cta": { "label", "route" }, "status": "open" } ],
  "intervention_impact": { "tracked": 6, "improved_share": 0.5, "avg_mastery_change": 6.2 },
  "paths": [ { "id", "title", "progress": 64, "status": "ai_suggested|draft|under_review|published" } ] }
```

**Analytics** `GET /educator/analytics?class_id`: `kpis`, `mastery_distribution`, `topic_heatmap` (per topic by kind: concept, application, industry, exam, recall), `struggling_concepts` (topic, class mastery, share of learners below 50, common misconceptions), `trend` (weekly).

**Students** `GET /educator/students?class_id` returns `[ { learner_id, studentName, progress, status: "on_track|at_risk|behind", mastery, last_active_at, streak_days, pending_assignments, gaps: ["Trees"] } ]`. `GET /educator/students/{id}` returns the same data as the learner's own `GET /learner/progress` for that learner, plus `interventions[]`.

**Knowledge graph** `GET /educator/knowledge-graph?class_id&learner_id?` returns `{ nodes: [ { id, name, class_mastery, learner_mastery, state: "strong|developing|gap", predicted_gap } ], edges: [ { from, to, type: "prerequisite" } ] }`.

**Materials** list item: `{ id, type, title, subtitle, caption, status: "processing|ready|failed", chunks, topic_ids, uploaded_at, authority, language }`.

**Learning path** `GET /educator/paths?class_id`: `{ id, class_id, version, status, topics: [], modules: [ { id, title, topic_ids, order, weight_percent, due_at, delivery_notes } ], order: [] }`. Statuses are exactly `ai_suggested`, `draft`, `under_review`, `published`.

**Assignments** list item: `{ id, title, type, brief, due_date, rubric: {}, weight_percent, status, assigned, submitted, graded, avg_score }`. `GET /educator/assignment-types` returns the type options for the create modal (quiz, assignment, test, voice_explain, slides).

---

## 5. Data model

Two SQLite files, WAL mode. Every table has `id` (text uuid or slug), `created_at`, `updated_at`. Columns marked `json` are JSON. Cross-database joins are done in code by the personalization block.

### 5.1 `user.db`

```
users
  id, email (unique), password_hash, role ("educator"|"learner"), status, full_name, display_name, avatar_url,
  country, timezone, last_login_at, ui_language, content_language, secondary_languages json,
  accessibility json   # font_scale, high_contrast, captions, extra_time_factor
  voice_settings json  # stt_lang, tts_voice, speech_rate, auto_listen
  connectivity json    # low_bandwidth_mode, offline_cache_enabled
  notifications json, consent json

learner_profiles
  user_id, institution, program, specialization, year, semester, student_code,
  reading_level ("A2"|"B1"|"B2"|"C1"|"native"), explanation_depth ("simple"|"standard"|"deep"),
  pace ("slow"|"normal"|"fast"), preferred_formats json (ranked: reading, slides, flashcards, voice),
  modalities json ({reading, listening, speaking, visual: 0..1}), study_minutes_per_day,
  goals_text, career_interests json, target_grade, prior_knowledge json ({topic_id: 0..1}),
  self_confidence json ({subject_id: 1..5}), accommodations json, streak_days, longest_streak, last_active_at

learner_subject_settings   learner_id, subject_id, class_id, intent ("pass"|"pass_learn"|"industry"|"extracurricular"),
                           weekly_hours, target_score, preferred_formats json

educator_profiles
  user_id, institution, department, designation, years_experience, bio, subjects_taught json,
  teaching_style json, default_plan json ({assignments_count, assessments_count, end_sem_weight, project_count}),
  default_question_mix json ({concept, application, industry, exam}), default_difficulty (1..5),
  grading_strictness (1..5), delivery_notes_default, alert_rules json, intake_language

classes        educator_id, subject_id, name, term, section, status
enrollments    class_id, learner_id, subject_id, status ("enrolled"|"dropped"), joined_at
mastery        learner_id, topic_id, score 0..1, confidence, attempts, last_practiced_at, history json
attempts       learner_id, class_id, assignment_id, item_id, topic_id,
               kind ("concept"|"application"|"industry"|"exam"|"recall"), mode ("text"|"voice"|"flashcard"|"quiz"),
               correct 0..1, time_taken_s, transcript, rubric_scores json, feedback, created_at
progress       learner_id, topic_id, subject_id, status ("not_started"|"in_progress"|"completed"),
               blocks_viewed json, updated_at
personal_tasks learner_id, title, subject_id, due_at, type, status, notes
submissions    assignment_id, learner_id, status ("not_started"|"in_progress"|"submitted"|"graded"|"late"),
               score, answer json, transcript, feedback, submitted_at, graded_at
flashcard_state     learner_id, card_id, ease, interval_days, reps, lapses, due_at, last_reviewed_at
flashcard_sessions  learner_id, subject_id, topic_id, card_ids json, reviewed json, started_at, finished_at
practice_exams      learner_id, subject_id, mode ("exam"|"rapid_fire"), spec json, item_ids json,
                    started_at, minutes, status, score, submitted_at
voice_sessions      learner_id, subject_id, topic_ids json, config json, turns json
predicted_gaps      learner_id, topic_id, readiness, reason, created_at, resolved
next_actions        educator_id, class_id, learner_id, topic_id, kind, title, detail, priority, impact, status, cta json
interventions       educator_id, learner_id, class_id, type ("check_in"|"meeting"|"extra_material"|"assignment_adjustment"),
                    topic_ids json, note, baseline json, followup json, window_days, status ("tracking"|"measured")
messages            from_id, to_id, class_id, kind, body, created_at     # stored only, no learner inbox
study_events        learner_id, kind, subject_id, topic_id, seconds, at   # optional, seeded
assistant_sessions  user_id, role, context json, turns json
jobs                kind, status, progress, result_ref, error, created_by
cache               key, value json, expires_at
```

### 5.2 `course.db`

```
subjects        name, category, icon, description, degree, specialization
topics          subject_id, name, description, prereq_ids json, difficulty ("Easy"|"Medium"|"Hard"), est_minutes, order_index
materials       class_id, owner_id, type ("educator_notes"|"textbook"|"slides"|"pdf"|"web_link"), title, subtitle, caption,
                url, file_path, published_at, uploaded_at, version, authority 0..1, language, status
material_chunks id, material_id, class_id, topic_ids json, text, locator, origin ("educator"|"external")
                + FTS5 virtual table material_chunks_fts(text, content='material_chunks')
plans           class_id, version, status ("ai_suggested"|"draft"|"under_review"|"published"), published_at
plan_items      plan_id, kind ("topic"|"assignment"|"assessment"|"project"|"exam"), title, topic_ids json,
                due_at, weight_percent, delivery_notes, order_index, module_id
drafts          class_id, kind ("quiz"|"assignment"|"test"|"voice_explain"|"slides"|"path"), status ("generating"|"ready"|"approved"|"rejected"),
                payload json, validation_warnings json, source_chunk_ids json, model_info json, review_notes, created_by
assignments     class_id, type ("quiz"|"assignment"|"test"|"voice_explain"|"project"), title, brief, rubric json, key_points json,
                topic_ids json, item_ids json, due_at, weight_percent, status ("draft"|"distributed"), approved_by, version
slide_decks     class_id, topic_ids json, title, slides json, approved bool, version
question_bank   class_id, topic_ids json, kind ("concept"|"application"|"industry"|"exam"), type ("mcq"|"short"|"voice_explain"),
                prompt, options json, answer, explanation, difficulty 1..5, source_chunk_ids json, approved bool
flashcards      deck_id, class_id, topic_id, front, back, source_chunk_ids json, source ("seed"|"generated"|"educator")
topic_content   topic_id, class_id, language, reading_level, blocks json, approved bool, is_fallback bool
revision_sections subject_id, section_id, content json, generated bool
conflicts       class_id, topic_id, claim_a json, claim_b json, winner ("a"|"b"), reason, trust_a, trust_b,
                overridden_by_educator bool, status ("open"|"resolved")
assignment_distributions assignment_id, class_id, learner_ids json (null = whole class), assigned_at, due_at
```

Rules: only approved content is visible to learners. Plan weightages total 100, validated on save. Questions are stored once in `question_bank`; quizzes and tests reference ids.

Indexes: unique `users.email`; `attempts (learner_id, topic_id, created_at)`; unique `mastery (learner_id, topic_id)`; FTS5 on chunk text.

---

## 6. Personalization block

### 6.1 Feature registry

```python
REGISTRY = {}
def feature(name, roles=("educator","learner")):
    def wrap(fn): REGISTRY[name] = (fn, set(roles)); return fn
    return wrap
async def call(name, ctx, payload):
    fn, roles = REGISTRY[name]
    if ctx.user.role not in roles: raise Forbidden()
    return await fn(ctx, payload)
```

`ctx` carries the user, repositories for both databases, the LLM router and a clock, so features are testable with fakes. Route handlers stay under 15 lines and only call `call(...)`. Adding a feature means one new file in `features/` and one route.

### 6.2 Features (one function each)

Learner: `get_dashboard`, `list_subjects`, `get_subject`, `enroll`, `get_lesson`, `complete_topic`, `submit_quiz`, `list_tasks`, `create_task`, `update_task`, `delete_task`, `get_task`, `submit_task`, `get_calendar`, `voice_turn`, `voice_options`, `get_flashcard_session`, `review_flashcard`, `get_exam_overview`, `generate_exam`, `submit_exam`, `get_revision_section`, `get_progress`, `update_profile`.

Educator: `list_classes`, `get_class_dashboard`, `get_analytics`, `list_students`, `get_student`, `get_knowledge_graph`, `log_intervention`, `list_interventions`, `get_intervention_impact`, `list_next_actions`, `update_next_action`, `ingest_material`, `process_material`, `list_materials`, `detect_conflicts`, `override_conflict`, `suggest_paths`, `save_path`, `set_path_status`, `publish_path`, `propose_change`, `apply_change`, `generate_content` (assignment, quiz, test, voice_explain), `generate_slides`, `review_draft`, `distribute_assignment`, `list_submissions`, `grade_submission`, `assistant_chat`, `assistant_insight`, `assistant_draft`.

### 6.3 Engines (pure functions, unit tested, no I/O)

**Mastery** (`mastery.py`). On an answer with `correct` in 0..1: `m = m + lr * (correct - m)`, with `lr` concept 0.35, application 0.35, industry 0.30, exam 0.30, recall 0.20. Decay `m *= exp(-days_since / 21)`. Seed from `prior_knowledge`.

**Topic progress** (`progress.py`). `status` is `completed` when marked complete or the topic quiz scores at least 70 percent. `progress_pct` is 100 when completed, 0 when untouched, otherwise `round(100 * (0.5 * blocks_viewed_share + 0.5 * mastery))`. Subject: `totalTopics` = topics in the learner's published plan (or all subject topics if none); `topicsCompleted` = completed topics; `progress` = `round(100 * completed / total)` or 0; `lastStudiedTopic` = latest `progress.updated_at`; `estimatedRemainingMinutes` = sum of `est_minutes * (1 - progress_pct/100)` over unfinished topics; `continue_topic_id` = latest in-progress topic, else first not started.

**Predicted gaps** (`gaps.py`). For each topic due in the next 14 days: `readiness = min(mastery(T), mean(mastery(prereqs)))`. Below 0.55 is a predicted gap. Write `predicted_gaps`, insert a remedial item before the topic on the weakest prerequisite, store the reason, and surface it in the learner recommendation and the educator knowledge graph, alerts and next best actions. This is objective 2.

**Exam readiness** (`readiness.py`). `0.5 * weighted topic mastery + 0.3 * accuracy of the last 5 practice exams + 0.2 * share of topics completed`, as a percent. Return `null` with reason "not enough data" when there is no activity. `needs_review` when topic accuracy is below 60. The recommendation is the lowest-readiness topic due soonest, from a template, no model call.

**Progress page.** Skill areas over the last 30 days: Concept = kind `concept`; Application = kinds `application` and `industry`; Exam Readiness = kind `exam` plus practice exams; Recall = flashcard known rate. Smooth each with prior 0.5 and weight 3. `overall_understanding.percent` = mean mastery over enrolled topics; `mastered_share` = share of topics at or above 0.8; `focus` when mastery is below 0.6. Streak = consecutive days (ending today or yesterday) with an attempt or study event. Insight: pick the strongest and weakest skill area and the weakest topics, fill a template (headline, detail, recommendation). No Agnes call.

**Flashcard scheduling** (`scheduling.py`). SM-2 style. Know = quality 4, Don't Know = quality 1. Due cards first, then new cards.

**Trust** (`trust.py`). `trust = 0.4 * authority + 0.3 * recency + 0.3 * agreement`. Authority: educator notes 1.0, textbook 0.8, slides 0.7, web link 0.4. Recency decays with age in years. Agreement is the share of other chunks that support the claim. The higher trust wins automatically; store a plain-language reason. An educator override is permanent for that claim. Conflict detection (`detect_conflicts`) runs when materials finish processing: for each topic with chunks from two or more materials, ask Agnes (`compare_sources`, background priority) for contradictory claims, then score them with the formula.

**Student status** (`actions.py`). `at_risk`: mastery fell more than 10 points in 7 days or no activity for 3 days. `behind`: more than 2 overdue items, or readiness below 0.5 on a topic due within 7 days. Otherwise `on_track`.

**Next best actions** (`actions.py`). Rule generated, stored in `next_actions`, refreshed at most once a minute per class. Rules: (1) submission awaiting grading over 24 hours, (2) learner inactive 3 days (suggest check-in), (3) learner mastery dropped over 10 points in a week, (4) topic with class mastery below 50 (suggest re-teach or generate practice), (5) predicted gap on an upcoming topic, (6) deadline within 48 hours with low submission rate, (7) AI draft waiting for approval, (8) conflict awaiting review, (9) intervention follow-up due. Impact: `high` for rules 1, 3, 4, 5; `medium` for 2, 6, 7, 8; `low` for 9. Titles and details come from templates. The Students "Intervene" and "Send Check-in" actions call `log_intervention`.

**Interventions** (`impact.py`). Logging stores a baseline snapshot of the 14 days before (targeted topic or overall mastery, weekly study minutes, assignment completion, recent scores) and creates a `messages` row for check-ins. Impact compares the 14 days after: `improved` when mastery rose 5 points or more, `declined` when it fell 5 or more, otherwise `no_change`. Return per-intervention deltas and a class summary (share improved, average change, best intervention type). Seed three interventions with believable numbers.

**Adaptation** (objective 1). `get_lesson` and `voice_turn` read the learner profile and mastery to choose: explanation depth and reading level in the system prompt, language, block order from `preferred_formats` and `modalities` (for example voice and flashcards first for a speaking-oriented learner), and extra scaffolding blocks for topics below 0.5 mastery. Output includes `adapted_for` so the choices are visible. Lessons are generated lazily from approved chunks, saved in `topic_content`, and cached per (topic, language, reading level, depth).

---

## 7. LLM layer

### 7.1 Local profiles (Qwen3.5 4B, 6 GB VRAM)

- `llama-server` runs natively: Q4_K_M GGUF from Hugging Face, all layers on GPU, context 4096 to 8192, OpenAI-compatible, streaming. The backend knows only `LOCAL_URL` and `LOCAL_MODEL`.
- `local_chat`: thinking off. Used for voice conversation and short rewrites.
- `local_reason`: same server with thinking on, only for math and code explanations. Check the model card for the exact thinking switch. If a confidence check fails, escalate to Agnes.
- Strip any `<think>...</think>` block. Never stream or speak it.
- Voice style prompt: two or three short sentences, spoken language, no markdown, lists or code blocks, one idea at a time, end with a short follow-up question.

### 7.2 Router (policy is configuration, not code)

| Task | Backend |
|---|---|
| `chat`, `practice_feedback`, `small_rewrite`, `insight_polish` | local chat |
| `explain_math`, `explain_code` | local reason, escalate to Agnes on low confidence |
| `verify_claim`, `compare_sources`, `suggest_paths`, `parse_intent` | Agnes |
| `generate_*` (assignment, quiz, test, voice_explain, slides) | Agnes |
| `grade_conceptual`, `grade_voice_explanation` | Agnes |
| `educator_assistant` | Agnes (tool calling), fallback local without tools |

If a local server is down, its tasks fall back to Agnes. If Agnes times out, verification is skipped and the answer is marked `verified=false`.

### 7.3 Agnes limiter (in memory)

Token bucket at `AGNES_RPM` (10). Two priorities: `interactive` (voice verification, live grading, educator chat) with `AGNES_INTERACTIVE_RESERVE` (6) slots, and `background` (generation, conflict detection, path suggestions). Exponential backoff with jitter on 429 and 5xx, honour `Retry-After`. Cache by hash of (model, messages, params) in memory and the `cache` table. Never log keys or full prompts.

### 7.4 Verification flow

```
learner text -> FTS5 retrieve chunks for the subject and topic
  -> needs_verification()   # low retrieval score, claim outside sources, topic has an open conflict, asks for recent facts
  -> if yes: Agnes verify_claim -> { verdict, corrected, evidence, citations }
  -> local chat writes the spoken answer from chunks + verification result, streamed sentence by sentence
```

`needs_verification` is a deterministic function. Cache verified claims per subject. Before building anything, run `scripts/smoke_agnes.py` to check that Agnes streams and supports a strict JSON mode, and record the result in `docs/notes.md`. If JSON mode is missing, parse and validate with a repair step.

---

## 8. Content generation

One generator handles `assignment`, `quiz`, `test` and `voice_explain`. A separate small function handles `slides`. Both run as background tasks on Agnes and always produce a draft.

### 8.1 Loop

`plan -> retrieve -> generate -> validate -> repair (max 1) -> save draft`

1. **Plan:** a spec from the request (class, topics, counts, kind mix, difficulty, marks, language, delivery notes). Defaults come from `educator_profiles`.
2. **Retrieve:** ranked chunks via FTS5, educator material first.
3. **Generate:** JSON that matches the Pydantic schema for that kind.
4. **Validate (no model):** schema valid; every item has existing `source_chunk_ids` or is flagged `external`; counts, kind mix and marks match; MCQ has exactly one correct option and no duplicates; near-duplicates removed; marks and weights add up.
5. **Repair once** with the validation errors. If it still fails, save the draft with `validation_warnings`.
6. **Save** the draft and report progress on the job.

### 8.2 Kinds

- **quiz / test:** items with `kind` (`concept`, `application`, `industry`, `exam`), `type`, `prompt`, `options`, `answer`, `explanation`, `difficulty`, `source_chunk_ids`. Tests include sections, marks per item and a coverage table. Industry items describe a realistic scenario. On approval, items go to `question_bank`.
- **assignment:** `brief`, deliverables, a machine-readable `rubric` (criteria, weights, level descriptors).
- **voice_explain:** an explanation prompt, `key_points` a good answer must cover, and a rubric. Grading compares the learner's transcript with the key points.
- **slides:** `{ title, slides: [ { layout, title, bullets (max 6), speaker_notes, source_chunk_ids } ] }`. One idea per slide. Speaker notes are required. Shown as a preview (the `slides` block in Learn and in the educator page); `.pptx` export only if time remains.

### 8.3 Review

`approve` copies a draft into its final table, sets `approved_by` and `version`, and (for assignments) enables distribution. `reject` stores notes for regeneration. A learner can only see approved content.

---

## 9. Voice and assistants

### 9.1 Learner voice tutor

`POST /voice/turn` body `{ text, subject_id, topic_id, goal, mode, difficulty?, style?, language?, session_id? }`. The configuration travels with each request, so the endpoint is stateless unless `session_id` is given, in which case the last 6 turns are kept in `voice_sessions`. Response is a streaming SSE body: `sentence` events, then `done { verified, citations, followups, external }`.

Pipeline: load config and learner profile, retrieve top chunks for the subject and topic, `needs_verification`, optional Agnes verification, local streaming answer, save the turn.

- Answers stay inside the subject's material. A general question is answered but labelled `external`.
- The system prompt is built from `reading_level`, `explanation_depth`, `pace`, language, the goal, the difficulty, the style, the mode (tutor persona) and the learner's weak topics.
- Goal `explain it back to me` switches to grading: score the explanation against the topic's key points and write an `attempt` of kind `concept`, mode `voice`.
- Math and code questions use `local_reason`.
- `GET /voice/options` returns `{ goals, difficulties, styles, languages, modes }` from constants in code. Goals: understand the concept, practice questions, revise for exam, explain it back to me. Difficulties: beginner, intermediate, advanced. Styles: step by step, Socratic questions, short and direct, analogy based. Modes: friendly tutor, strict examiner, study buddy. `GET /voice/status` returns `{ ready, local, online }`.
- Every voice action also works with typed text. Speech to text and text to speech are in the browser.

### 9.2 Educator assistant (Agnes companion and AI Assistant page)

- `POST /educator/assistant/chat` streams text over SSE. Body `{ text, context: { page, class_id, learner_id?, topic_id? } }`. The assistant uses tool calling on Agnes (interactive priority) with read-only registry functions: `get_class_dashboard`, `get_analytics`, `get_student`, `list_next_actions`, `get_knowledge_graph`. It never changes data. Answers name the data they used.
- `POST /educator/assistant/insight` ("Generate Insight") returns JSON recommended actions, built from the next best actions rules and optionally polished by one Agnes call.
- `POST /educator/assistant/draft` ("Draft Content") starts a generation job and returns `{ job_id }`.
- If Agnes is unavailable, answer from a data summary prepared by the backend using the local model, without tools, and label the reply as limited.

### 9.3 Requirement changes and educator voice intake

`POST /educator/paths/change` takes `{ class_id, text }` (typed or transcribed, such as "exam moved to Friday" or "new student joined") and returns a proposed diff: affected plan items, new dates, learners whose predicted gaps change. The educator confirms with `POST /educator/paths/change/apply`, which updates the plan, reruns gap prediction and refreshes next best actions. Nothing is applied without confirmation. Speech recognition runs in the browser.

---

## 10. Materials processing

`POST /educator/materials` (multipart PDF, DOCX, PPTX, TXT, or JSON `{ url }`) saves the file, creates a `materials` row with status `processing`, and starts a background task that: extracts text, splits it into chunks of about 300 to 500 words with overlap, tags topics (keyword match against topic names first, then one Agnes call for ambiguous chunks at background priority), writes `material_chunks` and the FTS5 index, runs `detect_conflicts`, and sets status `ready` or `failed`. Chunks from educator uploads have origin `educator`, everything else `external`. `POST /educator/materials/{id}/process` reruns processing ("Process Content").

---

## 11. Seed data

`scripts/seed.py` creates, from JSON files, everything below. The first screens must look exactly like the mock data.

- Users: learner Alex (full profile, enrolled in 4 subjects), seven other learners with varied profiles (reading levels, paces, intents, languages) and varied mastery, and one educator.
- Subjects: Data Structures (core, icon tree), Database Management Systems, Computer Networks, Web Technologies. Data Structures topics: Arrays, Linked Lists, Trees, Graphs, Dynamic Programming with prerequisites and difficulty and duration. Seed mastery so Arrays 92, Linked Lists 81, Trees 54, Graphs 42, overall 74, subject progress 72 (18 of 25 topics), readiness 71, streak 6.
- Tasks: "Binary Trees Implementation" (Assignment, due today), "Normalization Test" (Test, tomorrow), "Network Security Assessment" (Assessment, 12 Oct).
- Materials: three sources for Data Structures (educator notes, a textbook PDF excerpt, a web link) where two make a contradicting claim (for example the worst-case complexity of a hash table lookup stated differently), so the conflict panel has a real case.
- 60 or more approved questions in `question_bank` across the four kinds, 8 flashcards per topic, one approved lesson per Data Structures topic, one saved slide deck.
- Two AI drafts waiting for approval (one quiz, one voice assignment), a path in `ai_suggested` status, and three interventions with baseline and follow-up numbers.
- Weekly trend rows, study time totals and misconception text, marked as sample.
- Saved fallback outputs for every Agnes-generated artifact, with `is_fallback = true`. The UI should show a "saved sample" label for them.

---

## 12. Demo script (must work end to end)

1. Educator speaks "move the midterm to Friday and add a project", confirms the proposed change.
2. Educator uploads a new source. A conflict card appears showing which source won and why. Educator overrides it once.
3. Educator generates a quiz and a voice assignment, reviews and approves them, distributes them to the class, publishes the learning path.
4. Learner (Alex) sees the new tasks on the dashboard, opens a topic, switches between reading, slides and flashcards.
5. Learner asks the voice tutor a question, hears a grounded answer with a citation, then explains a concept back and gets graded.
6. A weak result on Trees causes a predicted gap on Graphs. The learner's recommendation changes and a remedial item appears.
7. Educator dashboard shows the weak concept, an at-risk student and the next best actions. The educator sends a check-in. Intervention Impact shows seeded before and after results.
8. Educator asks the assistant "who needs help this week?" and gets an answer from the class data.

---

## 13. Build order

Do these in order. Stop at the end of each phase and run its check.

**Phase 0 (about 30 minutes).** Create the venv and the repo layout. Run `scripts/smoke_agnes.py` (streaming and JSON mode check) and `scripts/start_local_llm.ps1` plus `scripts/bench_local.py`. Write all Pydantic schemas from section 4.4. Write `docs/notes.md` with the results and any mismatch with the real front end code (read the front end and correct this guide where it differs). Check: Agnes and the local model both answer.

**Phase 1 (before the 6 pm review).**
1. Settings, both databases, models, seed script, `uvicorn` starts.
2. Demo login, `me`, profile update, CORS, the API client in the front end.
3. Registry, LLM router, limiter.
4. Learner read endpoints: dashboard, subjects, subject detail, learn, tasks, calendar, progress, exam overview (all from seed data and the engines).
5. Educator read endpoints: classes, dashboard, analytics, students, student detail.
6. Materials upload, parse, chunk, FTS5, list.
7. Generation of quiz and voice assignment as drafts, approve, distribute, learner sees the task.
8. Voice turn with retrieval, verification and streaming.
Check: the learner screens and the educator dashboard run on real endpoints with no mock data, and the demo steps 3 to 5 work.

**Phase 2 (overnight).**
1. Conflict detection, trust scoring, conflicts endpoints.
2. Learning paths: suggest, edit, status, publish, change by text with confirmation.
3. Gap prediction, replanning, learner recommendation, knowledge graph.
4. Next best actions, interventions and impact.
5. Flashcards with scheduling, practice exams and rapid fire, quiz submit, task submit, topic complete.
6. Educator assistant with streaming and tools, insight, draft.
7. Slides generation preview.
8. Personalized lessons from the profile.

**Phase 3 (last two hours).** Pre-generate and save fallback outputs. Failure handling: Agnes down, local model down, microphone missing, upload failure. Rehearse the demo script twice and fix only what breaks. Remove any remaining reads from `mockData.js` and localStorage state that the backend now owns.

Cut line if time runs out, in this order: slides preview, intervention follow-up, educator assistant tools, rapid fire, personal calendar details.

---

## 14. Environment variables

```
SECRET_KEY=
USER_DB_URL=sqlite:///./data/user.db
COURSE_DB_URL=sqlite:///./data/course.db
UPLOAD_DIR=./data/uploads
LOCAL_URL=http://127.0.0.1:8081/v1
LOCAL_MODEL=qwen3.5-4b
LOCAL_REASON_ESCALATE_TO_AGNES=true
AGNES_API_KEY=            # server only, never logged
AGNES_BASE_URL=https://apihub.agnes-ai.com/v1
AGNES_TEXT_MODEL=agnes-3.0-flash
AGNES_RPM=10
AGNES_INTERACTIVE_RESERVE=6
CORS_ORIGINS=http://localhost:5173
DEMO_MODE=true
```

## 15. Rules for the coding agent

- Follow section 13 in order. Do not build anything marked cut.
- Route handlers stay under 15 lines. Logic goes in features and engines.
- Write unit tests for the engines (mastery, progress, gaps, readiness, trust, scheduling, actions, impact) and for the generator's validators before wiring them. Other tests are optional.
- Where this guide and the real front end code disagree, follow the front end, keep going, and record the difference in `docs/notes.md`.
- Prefer the simplest working code. No abstractions the demo does not need.
- Never return or log the Agnes key, password hashes or tokens.
- Content produced by Agnes during the demo is saved, and the saved copy used as a fallback must carry `is_fallback = true` and be labelled in the UI.