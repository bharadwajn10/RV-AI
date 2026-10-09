# Hackathon Build Guide: Learning Experiences Backend

Audience: the coding agent (Antigravity). This replaces the earlier production-scale guide. Goal: a backend that works for a live demo on one laptop within about a day. Keep every feature, cut every piece of infrastructure that the demo does not show.

Hard dates: review 9 Oct 6:00 pm, final submission 10 Oct 6:30 am.

Read sections 1 to 5 fully before writing code. Then follow section 12 in order.

---

## 1. Rules for the build

1. **One app, one command.** A single FastAPI process. Start with `uvicorn app.main:app`. No Docker, Redis, job queue or CI.
2. **Three blocks as packages.** `user_db`, `course_db`, `personalization`. Only `personalization` imports the other two. Routes call features by name.
3. **Every feature is a function** registered in a small registry (section 6). New features are added by adding one function.
4. **Front end isolation.** Versioned routes `/api/v1`, a standard response envelope, full resources returned, new fields only added. The existing front end must not need changes when the backend adds features.
5. **Educator stays in control.** Generated slides, quizzes, assignments and assessments are drafts until the educator approves them.
6. **Cite sources.** Generated content carries `source_chunk_ids`. Content not backed by the educator's material is marked `external`.
7. **Agnes is limited to 10 text requests per minute.** All Agnes calls go through one in-memory limiter with priorities, backoff and a cache.
8. **Demo safety.** Seed realistic data. Save generated outputs as fallbacks marked `is_fallback=true` and show that label in the UI.
9. **Never log or return the Agnes key, password hashes or tokens.**

## 2. Stack

| Concern | Choice |
|---|---|
| API | Python 3.12, FastAPI, uvicorn, Pydantic v2 |
| Storage | SQLite in WAL mode via SQLAlchemy 2.0. Two files: `user.db` and `course.db`. JSON columns for flexible fields |
| Search | SQLite FTS5 (BM25) on source chunks in `course.db` |
| Background work | FastAPI `BackgroundTasks` or `asyncio.create_task`, with a `jobs` table and SSE progress |
| Local LLM | `llama-server` (llama.cpp) running natively, Qwen3.5 4B GGUF Q4_K_M, OpenAI compatible API, streaming |
| Online LLM | Agnes `agnes-3.0-flash` at `https://apihub.agnes-ai.com/v1/chat/completions`. Image model optional and last |
| Auth | Email and password (argon2 or bcrypt), signed token in an httpOnly cookie, two roles |
| Parsing | `pypdf`, `python-docx`, `python-pptx`, `trafilatura` |
| Slide export | `python-pptx` |
| Tests | `pytest` for engines and validators only |

Optional later: a small embedding model on CPU with in-memory similarity search if FTS5 retrieval is not good enough.

## 3. Layout

```
backend/
  app/
    main.py
    core/            # settings, security, errors, envelope, ids
    api/v1/          # thin routers: auth, educator, learner, voice, jobs
    schemas/         # Pydantic models (single source of truth, written first)
    user_db/         # models + repositories for user.db
    course_db/       # models + repositories for course.db (incl. FTS5)
    personalization/
      registry.py
      features/      # educator_*.py, learner_*.py, voice.py
      engines/       # mastery.py, gaps.py, trust.py, scheduling.py (pure)
      agents/        # base.py, slides.py, quiz.py, assignment.py, assessment.py
      llm/           # router.py, local.py, agnes.py, limiter.py, cache.py, verifier.py
    seed/            # demo data and saved fallback outputs
  tests/
  scripts/           # smoke_agnes.py, bench_local.py, start_local_llm.ps1
  .env.example
```

## 4. Data model

Two SQLite files. Cross-database joins are done in code by the personalization block. Every table has `id` (text uuid), `created_at`, `updated_at`. JSON columns are marked `json`.

### 4.1 `user.db`: common user (both roles)

```
users
  id, email (unique), password_hash, role ("educator"|"learner"|"admin"), status ("active"|"disabled"),
  full_name, display_name, avatar_url, country, timezone, last_login_at
  ui_language, content_language, secondary_languages json
  accessibility json   # font_scale, high_contrast, captions, reduce_motion, extra_time_factor
  voice_settings json  # stt_lang, tts_voice, speech_rate, auto_listen, wake_phrase_enabled
  connectivity json    # low_bandwidth_mode, offline_cache_enabled, last_known_speed
  notifications json   # channels, quiet_hours, digest_frequency, alert_thresholds
  consent json         # data_use, voice_storage, analytics
```

### 4.2 `user.db`: learner details

```
learner_profiles
  user_id, institution, program, specialization, year, semester, student_code
  reading_level ("A2"|"B1"|"B2"|"C1"|"native")   # proficiency in language of instruction
  explanation_depth ("simple"|"standard"|"deep")
  pace ("slow"|"normal"|"fast")
  preferred_formats json        # ranked: reading, flashcards, slides, voice, game
  modalities json               # {reading:0..1, listening:0..1, speaking:0..1, visual:0..1}
  study_minutes_per_day, preferred_study_windows json, device_type
  goals_text, career_interests json, target_grade
  prior_knowledge json          # {topic_id: 0..1}
  self_confidence json          # {subject_id: 1..5}
  accommodations json
  streak_days, longest_streak, xp, level, badges json, last_active_at

learner_subject_settings          # one row per learner per subject, overrides global defaults
  learner_id, subject_id, class_id,
  intent ("pass"|"pass_learn"|"industry"|"extracurricular"),
  weekly_hours, target_score, enrichment_unlocked bool, preferred_formats json
```

### 4.3 `user.db`: educator details

```
educator_profiles
  user_id, institution, department, designation, years_experience, bio
  subjects_taught json, classes_taught json
  teaching_style json             # lecture, project_based, flipped, discussion
  default_plan json               # assignments_count, assessments_count, end_sem_weight, project_count
  default_question_mix json       # {concept, application, industry, exam}
  default_difficulty (1..5), grading_strictness (1..5)
  delivery_notes_default
  alert_rules json                # e.g. {class_mastery_below: 0.5, learners_behind_pct: 30}
  intake_language, office_hours json
```

### 4.4 `user.db`: learning state

```
classes        educator_id, subject_id, name, term, section, schedule json, status
enrollments    class_id, learner_id, joined_at, status
mastery        learner_id, topic_id, score, confidence, attempts, last_practiced_at, history json
attempts       learner_id, class_id, assignment_id, item_id, topic_id,
               kind ("concept"|"application"|"industry"|"exam"), mode ("text"|"voice"),
               correct (0..1), time_taken_s, hints_used, transcript, rubric_scores json, feedback
progress       learner_id, plan_item_id, status ("todo"|"doing"|"done"), score, completed_at
voice_sessions learner_id, subject_id, turns json, created_at
rapid_fire_runs learner_id, subject_id, score, streak, duration_s, items json
predicted_gaps learner_id, topic_id, readiness, reason, created_at, resolved bool
jobs           kind, status, progress, result_ref, error, created_by
```

### 4.5 `course.db`

```
subjects        name, degree, specialization, description
topics          subject_id, name, description, prereq_ids json, difficulty, est_minutes
sources         class_id, owner_id, type ("educator_notes"|"textbook"|"slides"|"pdf"|"web_link"),
                title, url, published_at, uploaded_at, version, authority, language
source_chunks   source_id, class_id, topic_ids json, text, locator          + FTS5 virtual table on text
plans           class_id, version, status ("draft"|"published"), published_at
plan_items      plan_id, kind ("topic"|"assignment"|"assessment"|"project"|"exam"), title,
                topic_ids json, due_at, weight_percent, delivery_notes, order_index
drafts          class_id, agent, kind, status ("generating"|"ready"|"approved"|"rejected"),
                payload json, validation_warnings json, source_chunk_ids json, model_info json, review_notes
slide_decks     class_id, topic_ids json, title, slides json, approved_by, approved_at, version
quizzes         class_id, topic_ids json, title, item_ids json, approved_by, approved_at, version
assignments     class_id, type ("quiz"|"voice_explain"|"project"|"written"), title, brief,
                rubric json, key_points json, topic_ids json, due_at, approved_by, version
assessments     class_id, type ("test"|"exam"), title, blueprint json, sections json, duration_min,
                total_marks, coverage json, approved_by, version
question_bank   class_id, topic_ids json, kind, type ("mcq"|"short"|"voice_explain"), prompt, options json,
                answer, explanation, difficulty (1..5), source_chunk_ids json, approved bool
lessons         topic_id, class_id, spine json, language, is_fallback bool
conflicts       class_id, topic_id, claim_a json, claim_b json, winner, reason, overridden_by_educator bool
```

Rules: only approved rows are visible to learner features. Weightages in a plan must total 100, validated on save. Quizzes reference `question_bank` ids, so questions are stored once.

## 5. API contract

- Prefix `/api/v1`. Response envelope `{ "data": ..., "meta": {}, "error": null }`, errors `{ "data": null, "error": { "code", "message" } }`.
- Return the full resource. Unknown request fields are ignored.
- Long jobs return `202 { job_id }`. `GET /jobs/{id}` and `GET /jobs/{id}/events` (SSE).
- Voice replies stream over SSE.
- Export `openapi.json` and write `docs/api-contract.md` in Phase 0.

## 5b. Frontend alignment (React 19 + Vite, React Router v7, Context API, vanilla CSS)

The existing front end is the contract. Where this section and sections 4, 6 or 11 differ, **this section wins**. The front end currently runs on `mockData.js`, so the first integration step is replacing each mock with one API call, without changing component code beyond the data source.

Technical notes: allow CORS for `http://localhost:5173`. Subject and topic ids are human-readable slugs (for example `data-structures`, `binary-trees`), stored as text primary keys. The front end has two context providers: `CourseProvider` (subjects, topics, progress) and `TaskProvider` (assignments, exams, calendar events). Each provider should need exactly one endpoint to load its data: `GET /api/v1/learner/courses-state` returns subjects with topics and progress, and `GET /api/v1/learner/tasks` returns tasks.

### Routes to endpoints

| Front-end route | Backend |
|---|---|
| `/dashboard` | `GET /learner/dashboard`: stats (streak, xp, level, overall progress), recent subjects, upcoming tasks, quick actions |
| `/subjects` | `GET /subjects` (catalog with `enrolled` flag), `POST /subjects/{id}/enroll` |
| `/subjects/:subjectId` | `GET /subjects/{id}`: subject plus topics and modules with per-topic status |
| `/learn/:subjectId/:topicId` | `GET /learn/{subject_id}/{topic_id}`: topic content blocks (below), `POST /learn/{subject_id}/{topic_id}/complete` |
| `/tasks/:taskId` | `GET /tasks/{id}`, `POST /tasks/{id}/submit`, `PATCH /tasks/{id}` (status) |
| `/calendar` | `GET /learner/calendar?from&to`, `POST|PATCH|DELETE /learner/calendar/events` for personal events |
| `/progress` | `GET /learner/progress`: scores, completion per subject, mastery by topic, attempts by kind |
| `/settings` | `GET|PATCH /me/profile` (maps to `users` and `learner_profiles`) |
| Voice bubble and `/voice` | `POST /learner/voice/turn` (SSE), `GET /learner/voice/sessions`, `GET /learner/voice/sessions/{id}` |
| `/flashcards` | `GET /flashcards/decks`, `GET /flashcards/decks/{id}`, `POST /flashcards/decks/generate`, `GET /flashcards/due`, `POST /flashcards/review` |
| `/exam` | `POST /exam/generate`, `GET /exam/{id}`, `POST /exam/{id}/submit`, `GET /exam/history` |
| `/games` | `GET /games`, `POST /games/{id}/start`, `POST /games/runs/{run_id}/answer`, `POST /games/runs/{run_id}/finish`, `GET /achievements` |

The voice endpoint uses a streaming `POST` over SSE, not a websocket. The persistent bubble sends a `context` object with every turn, `{ route, subject_id, topic_id }`, so answers are about what the learner is looking at.

### Response shapes the front end already expects

Subject (keep these field names exactly, add more fields freely):

```json
{ "id": "data-structures", "name": "Data Structures", "category": "Core",
  "description": "", "progress": 72, "enrolled": true,
  "topicsCompleted": 18, "totalTopics": 25, "lastStudiedTopic": "Binary Trees" }
```

Computed on the server, never stored:
- `totalTopics` = topics in the subject's published plan for the learner's class (or all topics for non-enrolled subjects).
- `topicsCompleted` = topics with `progress.status = "done"`.
- `progress` = `round(100 * topicsCompleted / totalTopics)`. Return `0` when `totalTopics` is 0.
- `lastStudiedTopic` = name of the topic with the latest `progress.updated_at` or latest attempt.

Topic content for `/learn`:

```json
{ "id": "binary-trees", "subject_id": "data-structures", "title": "Binary Trees",
  "status": "todo|doing|done", "est_minutes": 20,
  "blocks": [
    { "type": "markdown", "body": "...", "source_chunk_ids": [], "external": false },
    { "type": "video", "url": "...", "title": "..." },
    { "type": "quiz", "quiz_id": "...", "items": [ ... ] },
    { "type": "flashcards", "deck_id": "..." } ] }
```

`blocks` is a JSON column on a `topic_content` table in `course.db` (topic id, language, blocks, approved flag, `is_fallback`). Markdown blocks come from `build_lesson` and the educator's approved material. Video blocks are links the educator attached, never generated. The block list is open ended so new block types need no front-end rewrite for old types.

Task (dashboard and calendar):

```json
{ "id": "", "subject_id": "", "title": "", "type": "Assignment|Exam|Reading|Quiz|Project",
  "due_at": "ISO", "status": "todo|doing|done|overdue", "weight_percent": 10,
  "score": null, "plan_item_id": "" }
```

Tasks are a **view** over data, not a separate table: `plan_items` due dates, approved `assignments` and `assessments`, plus learner `progress` rows. `status = overdue` is computed when `due_at` is past and status is not `done`. Personal calendar events live in a small `calendar_events` table in `user.db`.

### New or changed tables

`user.db`:

```
flashcard_reviews   learner_id, card_id, ease, interval_days, reps, lapses, due_at, last_reviewed_at   # spaced repetition (SM-2 style)
game_runs           learner_id, game_id, subject_id, score, streak, duration_s, state json, status, started_at, finished_at
achievements        id, name, description, icon, rule json                    # catalog, seeded
learner_achievements learner_id, achievement_id, earned_at
calendar_events     learner_id, title, start_at, end_at, kind, subject_id, notes
practice_exams      learner_id, subject_id, spec json, item_ids json, status, score, submitted_at, is_practice=true
```

`course.db`:

```
topic_content       topic_id, class_id, language, blocks json, approved bool, version, is_fallback
flashcard_decks     class_id, subject_id, topic_ids json, title, approved bool, source ("generated"|"educator")
flashcards          deck_id, front, back, hint, source_chunk_ids json
games               id, name, description, config json                         # seeded catalog
```

### Learner side generation (flashcards, practice exams, games)

The guide's rule is that educator content needs approval. Learner-triggered practice is different and must not wait for an educator:

- **Flashcards.** `POST /flashcards/decks/generate` first builds cards from approved `topic_content` and `question_bank` with no model call. If too few cards exist, it queues a local-model generation from source chunks and marks the deck `source: "generated"`, shown as unreviewed. Educator-approved decks are shown first.
- **Exam prep.** `POST /exam/generate` assembles a practice exam from the approved `question_bank` by subject, topics, count, difficulty and kind mix. If the bank is short, it queues question generation through Agnes at `background` priority and returns a job. Practice exams are labelled `practice` and never count toward official grades. Official educator assessments are separate and appear as tasks.
- **Games.** Rapid fire and other games draw questions from `question_bank` with no model call during play. Game state is saved in `game_runs`. Achievements are checked by rules after each run, for example streak milestones, first perfect score, and mastery thresholds.
- Spaced repetition: use SM-2 style scheduling in `engines/scheduling.py`, a pure function with unit tests. `GET /flashcards/due` returns cards whose `due_at` has passed.

### Gaps in the front end summary

These are not in the summary and need an answer before the backend is considered complete:

1. **Educator screens exist** and are specified in section 5d. Where the summary above says nothing, section 5d is the contract.
2. **No login or sign-up route is listed.** Add `POST /auth/login` and a login page, or use a seeded demo login with a role switch for the demo.
3. **No place yet for source citations or the `external` label.** Add a small citation chip component to markdown blocks and voice replies.

## 5c. Screen-level requirements (from the learner screenshots)

The app is called **studyspace**. This section extends 5b and wins where they differ. All numbers shown on screen are computed by the backend from real rows. The seed data must be able to reproduce the example values on the screens (Data Structures 72%, Trees 54%, Graphs 42%, readiness 71%, streak 6 days) so the front end looks identical after the switch from mock data.

### Dashboard (`GET /learner/dashboard`)

```json
{ "user": { "name": "Alex" },
  "subjects": [ { "id", "name", "progress": 72, "icon": "tree", "category": "Core" } ],
  "due_tasks": [ { "id", "type": "Assignment|Test|Assessment|Reading|Quiz|Project|Personal",
                   "title", "subject_id", "subject_name", "due_at", "status" } ],
  "quick_actions": [ { "id": "understand|voice|flashcards|game|rapid_fire", "title", "subtitle", "route" } ],
  "learning_modes": [ { "id": "understand|exam", "title", "subtitle", "route" } ] }
```

- Return `due_at` as ISO. The front end renders "Due today", "Tomorrow" and "Oct 12". Do not return display strings.
- The dashboard shows the learner's nearest three due tasks, soonest first, overdue first.
- **"+ Add Task" means learners create their own tasks.** `POST /learner/tasks` with `{ title, subject_id?, due_at, type? }`, `PATCH` and `DELETE` for personal tasks. Stored in `personal_tasks` and merged with plan-based tasks in `GET /learner/tasks` and the calendar. Personal tasks have `type: "Personal"`.
- Quick actions and learning modes come from the backend (a seeded list) so they can be changed without a front-end release.

### Subject page (`GET /subjects/{id}`)

```json
{ "id", "name", "category": "Core", "icon": "tree", "description",
  "progress": 72, "topicsCompleted": 18, "totalTopics": 25,
  "estimatedRemainingMinutes": 320,
  "topics": [ { "id", "name", "status": "completed|in_progress|not_started",
                "difficulty": "Easy|Medium|Hard", "est_minutes": 80,
                "progress_pct": 55 } ],
  "continue_topic_id": "trees" }
```

- `progress_pct` is per topic, 0 to 100. A topic is `completed` at 100, `in_progress` between 1 and 99, `not_started` at 0. It comes from content blocks finished, quiz done and mastery, as defined in `engines/progress.py`.
- `estimatedRemainingMinutes` = sum over unfinished topics of `est_minutes * (1 - progress_pct/100)`. The front end formats it as "5h 20m".
- `continue_topic_id` = the topic with the latest activity that is not completed, otherwise the first `not_started` topic.
- The subject page has tabs Concepts, Flashcards, Exam Prep and Progress. Each tab reuses the endpoints below with `subject_id` as a filter, so no extra endpoints are needed.
- Add `icon` (a short key the front end maps to an emoji or icon) and `difficulty` to `subjects` and `topics`.

### Voice tutor page

The page has a setup form, a microphone area, a recent session and a "choose a voice mode" panel.

- `GET /voice/options` returns the dropdown contents so the front end hard-codes nothing:
  ```json
  { "goals": [ { "id": "understand", "label": "Understand the concept" }, ... ],
    "difficulties": [ "beginner", "intermediate", "advanced" ],
    "styles": [ { "id": "step_by_step", "label": "Explain step-by-step" }, ... ],
    "languages": [ { "code": "en", "label": "English" }, ... ],
    "modes": [ { "id": "friendly", "label": "Friendly tutor", "description": "" }, ... ] }
  ```
  Goals to seed: understand the concept, practice questions, revise for exam, explain it back to me. Styles to seed: step by step, Socratic questions, short and direct, analogy based. Modes are tutor personas that change the system prompt (friendly tutor, strict examiner, study buddy).
- `GET /voice/status` returns `{ "ready": true, "local": "up|down", "online": "up|down" }`. It drives the "tutor ready" chip. Replace the "Mock tutor ready" text with this.
- `POST /voice/materials-preview` with `{ subject_id, topic_ids[] }` returns the sources and chunk counts found for those topics. This fills the "Learning from your materials" card, so it is a search, not a model call.
- `POST /voice/sessions` with `{ subject_id, topic_ids[], goal, difficulty, style, language, mode }` creates a session and returns `session_id`. The session config is stored and used for every turn.
- `POST /voice/sessions/{id}/turn` with `{ text }` streams the reply over SSE. This replaces the turn route in section 9: the config comes from the session, not the request. The floating bubble that appears on every page creates a lightweight session on first use with `{ subject_id?, topic_ids? from the current route, defaults for the rest }`.
- `GET /voice/sessions?limit=1` and `GET /voice/sessions/{id}` feed "Your conversation" (subject, topics, turns).
- Selecting a goal changes behaviour: `explain it back to me` switches the turn handler to grading mode, scoring the learner's explanation against the topic key points and writing an `attempt` of kind `concept` with `mode = voice`.

### Flashcards page

- `GET /flashcards/session?subject_id&topic_id` (topic optional, "All topics") returns the deck for a study session: `{ session_id, cards: [ { id, topic_id, topic_name, front, back } ], total, remaining }`, ordered with due cards first.
- Rating is **binary**: the buttons are **Don't Know** and **Know**. `POST /flashcards/review` with `{ card_id, known: true|false, session_id }`. Map to the scheduler as quality 4 for known and quality 1 for don't know.
- The side panel (cards reviewed %, Known, Still learning, Remaining) is derived by the front end from its own session state, but `GET /flashcards/session/{id}/summary` returns the same numbers for a page refresh.
- "Study session" starts a new session over due cards across the learner's subjects.

### Exam prep page (`GET /exam/overview?subject_id`)

```json
{ "practice_test": { "questions": 30, "minutes": 45, "difficulty": "mixed" },
  "readiness": { "percent": 71, "basis": "recent practice" },
  "topic_accuracy": [ { "topic_id", "name": "Trees", "accuracy": 54, "needs_review": true } ],
  "last_minute_revision": [ { "id": "important_concepts", "title": "Important concepts",
                              "subtitle": "Review high-value ideas from every unit.", "available": true } ],
  "recommendation": { "title": "Practice Graph Traversal",
                      "reason": "Graph accuracy is at 42%. A focused practice session can help strengthen this topic.",
                      "topic_id": "graphs", "actions": ["practice_topic", "start_exam"] } }
```

- `readiness.percent` = `0.5 * weighted topic mastery + 0.3 * recent practice exam accuracy (last 5) + 0.2 * share of topics completed`. Return `null` and the reason `"not enough data"` if there is no activity.
- `needs_review` is true when accuracy is below 60.
- `recommendation` comes from the gap engine: the lowest readiness topic that is due soon, with its text built from a template (no model call).
- `GET /exam/revision/{section_id}?subject_id` returns the expanded content of one revision section. Sections: important concepts (highest weight chunks and topic summaries), common exam questions (`question_bank` items of kind `exam`), key definitions (generated once per subject from source chunks and cached), quick revision (short recap per weak topic). Generate lazily with the local model, cache in `course.db`, and mark `generated`.
- `POST /exam/generate` with `{ subject_id, questions: 30, minutes: 45, difficulty: "mixed", topic_ids? }` and `POST /exam/{id}/submit` as in 5b. The timer is a front-end concern. The server stores `started_at` and rejects submissions that exceed `minutes` plus a small grace period.
- "Practice topic" calls `POST /exam/generate` with the single topic and a smaller count.

### Progress page (`GET /learner/progress`)

```json
{ "overall_understanding": { "percent": 74, "mastered_share": 0.48 },
  "skill_areas": [ { "id": "concept", "label": "Concept Understanding", "percent": 82 },
                   { "id": "application", "label": "Application", "percent": 68 },
                   { "id": "exam", "label": "Exam Readiness", "percent": 71 },
                   { "id": "recall", "label": "Recall", "percent": 76 } ],
  "stats": { "questions_answered": 248, "concepts_completed": 36,
             "study_minutes": 1120, "streak_days": 6 },
  "topic_mastery": { "subject_id": "data-structures", "topics": [ { "id", "name", "percent": 92, "focus": false } ] },
  "insight": { "headline": "A focused practice session can move you forward",
               "detail": "Your concept understanding is strong, but you need more practice applying Trees and Graphs.",
               "recommended": { "label": "Practice Graph Applications", "route": "/exam?topic=graphs" } } }
```

- Skill areas map to question kinds over the last 30 days: Concept = kind `concept`, Application = kinds `application` and `industry` merged, Exam Readiness = kind `exam` plus practice exams, Recall = flashcard known rate. Smooth with a prior of 0.5 and weight 3 so a few answers do not swing the percentage.
- `overall_understanding.percent` = mean mastery over the learner's enrolled topics. `mastered_share` = share of topics with mastery at or above 0.8.
- `focus` is true when topic mastery is below 0.6.
- `study_minutes` comes from `study_events`; `streak_days` = consecutive days ending today (or yesterday) with at least one study event or attempt.
- `insight` is rule-built: find the learner's strongest and weakest skill areas, and the weakest topics by readiness. Fill a template for the headline, detail and recommendation. Optionally polish the sentence with the local chat model, cached for the day. No Agnes call.
- `topic_mastery` accepts `?subject_id` and defaults to the learner's most recently studied subject.

### Study time tracking

The front end needs to report time spent so the study time and streak are real:

- `POST /learner/activity` with `{ kind: "learn|flashcards|exam|voice|game", subject_id?, topic_id?, seconds }`, sent by the front end every 30 to 60 seconds while a learning screen is active and visible.
- Stored in `study_events (learner_id, kind, subject_id, topic_id, seconds, at)`. Cap `seconds` at 120 per event to avoid inflated totals.

### Tables added by this section

`user.db`: `personal_tasks (learner_id, title, subject_id, due_at, type, status, notes)`, `study_events (learner_id, kind, subject_id, topic_id, seconds, at)`, `flashcard_sessions (learner_id, subject_id, topic_id, card_ids json, reviewed json, started_at, finished_at)`, and `voice_sessions` gets `config json` (goal, difficulty, style, language, mode, topic_ids).

`course.db`: `topics` gets `difficulty` and `est_minutes` (if missing), `subjects` gets `icon` and `category`, `revision_sections (subject_id, section_id, content json, generated bool, created_at)`, `voice_options (kind, id, label, description, order)` seeded.

### Seed requirement

Seed subjects: Data Structures, Database Management Systems, Computer Networks, Web Technologies, with the topics shown on screen for Data Structures (Arrays, Linked Lists, Trees, Graphs, Dynamic Programming) and a learner named Alex whose mastery and activity reproduce the screen values. Seed due tasks: "Binary Trees Implementation" (Assignment, today), "Normalization Test" (Test, tomorrow), "Network Security Assessment" (Assessment, 12 Oct). Do this in Phase 1 so the learner UI works against real endpoints immediately.

## 5d. Educator screens

The educator side exists in the front end with these screens: **Class Analytics**, **Students**, **Knowledge Graph**, **LearningPaths**, **StudyMaterials**, **Assignments**, **AI Assistant** (the Agnes companion bubble), **Next Best Actions**, and **InterventionImpact**. This section wins over earlier sections where they differ. Every educator endpoint is under `/api/v1/educator`, requires the `educator` role, and is limited to classes the educator owns.

Shared parameter: most endpoints take `class_id`. The educator's active class is chosen in a class switcher; `GET /educator/classes` lists their classes with subject, learner count and status.

### Class Analytics (`GET /educator/classes/{class_id}/analytics`)

```json
{ "kpis": { "avg_mastery": 63, "active_learners_7d": 21, "at_risk": 4,
            "completion_rate": 58, "avg_score": 71 },
  "mastery_distribution": [ { "bucket": "0-20", "count": 1 }, ... ],
  "topic_heatmap": [ { "topic_id", "name", "by_kind": { "concept": 70, "application": 48, "industry": 52, "exam": 55, "recall": 60 }, "class_mastery": 57 } ],
  "struggling_concepts": [ { "topic_id", "name", "class_mastery": 41, "learners_below_50_pct": 38,
                             "common_misconceptions": ["..."] } ],
  "trend": [ { "week": "2026-W40", "avg_mastery": 58, "active_learners": 19 } ] }
```

Reuse the engines from section 10. `struggling_concepts` is ranked by class mastery ascending, then by share of learners below 50. `common_misconceptions` comes from a cached summary of wrong conceptual and voice answers (local model, background priority, regenerated at most once a day per topic). Optional filter `?subject_id`.

### Students

- `GET /educator/classes/{class_id}/students` returns rows `{ learner_id, name, status: "on_track|at_risk|behind", mastery, last_active_at, streak_days, pending_assignments, weakest_topics[] }`.
- Status rules (config, not hard-coded): `at_risk` when mastery dropped more than 10 points in 7 days or no activity for 3 days. `behind` when overdue items exceed 2 or readiness is below 0.5 for a topic due within 7 days. Otherwise `on_track`.
- `GET /educator/students/{learner_id}?class_id=` returns the **same response shape as the learner's own Progress page** (section 5c), plus `interventions[]` and `notes`. Reuse the learner progress feature with a `learner_id` argument and an educator ownership check, so both views stay identical.
- `POST /educator/students/{learner_id}/notes` for private educator notes.

### Knowledge Graph (`GET /educator/classes/{class_id}/knowledge-graph?learner_id=`)

```json
{ "nodes": [ { "id", "name", "subject_id", "class_mastery": 57, "learner_mastery": null,
               "state": "strong|developing|gap", "predicted_gap": false } ],
  "edges": [ { "from": "arrays", "to": "trees", "type": "prerequisite" } ] }
```

Nodes are `topics`, edges are `prereq_ids`. `state` is `gap` below 0.5 class mastery, `developing` from 0.5 to 0.75, `strong` above. With `learner_id`, `learner_mastery` is filled and the state uses it. `predicted_gap` comes from the gap engine, so a weak prerequisite visibly points at the upcoming topic it threatens. Compute server side, return plain JSON.

### StudyMaterials

- `POST /educator/classes/{class_id}/materials` (multipart upload of PDF, PPTX, DOCX, TXT, or JSON body `{ url }` for links) returns `202 { job_id, material_id }`. The job parses, chunks, tags topics and indexes into FTS5. Progress comes from `GET /jobs/{id}/events`.
- `GET /educator/classes/{class_id}/materials` returns `{ id, title, type, status: "processing|ready|failed", chunks, topic_ids, uploaded_at, authority, language }`.
- `GET /educator/materials/{id}` (detail and chunk preview), `PATCH /educator/materials/{id}` (title, type, topic tags, authority), `DELETE /educator/materials/{id}`.
- Every chunk is tagged `educator` or `external` so generated content can show what came from the educator's own material.
- **Conflicts live on this screen.** `GET /educator/classes/{class_id}/conflicts` and `POST /educator/conflicts/{id}/override` render as a "Conflicts" panel: the two claims, the winning source and why, with an override button. This is a required objective, so the front end needs this small panel added.

### LearningPaths

- `GET /educator/classes/{class_id}/paths` returns the current plan: ordered topics and modules with `weight_percent`, `due_at`, `delivery_notes` and status.
- `POST /educator/classes/{class_id}/paths/suggest` returns `202 { job_id }`, then a suggested plan from the uploaded materials (Agnes, background priority). Suggestions are drafts. The educator reorders, edits counts of assignments and assessments, and sets weightages.
- `PUT /educator/classes/{class_id}/paths` saves the edited plan. Validation: weightages total 100, due dates inside the term, no topic before its prerequisites unless flagged.
- `POST /educator/classes/{class_id}/paths/publish` pushes it to the class. Learners then see the plan items as tasks (section 5b).
- **Requirement changes and voice intake live on this screen.** `POST /educator/classes/{class_id}/paths/change` takes `{ text }` (typed or transcribed, such as "exam moved to Friday" or "new student joined") and returns a proposed diff the educator confirms with `POST .../paths/change/apply`. This is the `parse_educator_intent` and `apply_requirement_change` feature. The front end needs a text box with a microphone button on this screen.

### Assignments

- `POST /educator/classes/{class_id}/assignments` creates one by hand: `{ title, type: "quiz|voice_explain|project|written|test", brief, rubric?, topic_ids, due_at, weight_percent, questions? }`.
- `POST /educator/classes/{class_id}/assignments/generate` starts an agent job (Quiz, Assignment or Assessment agent) and returns a draft. Review with the draft endpoints in section 8.6, which now also surface in this screen as "AI drafts".
- `POST /educator/assignments/{id}/distribute` with `{ class_id, learner_ids?: [...] }` (all learners when omitted) and `due_at`. Distribution creates the learner-visible tasks.
- `GET /educator/assignments/{id}/submissions` returns `{ learner_id, name, status: "not_started|in_progress|submitted|graded|late", submitted_at, score, flagged }`. `PATCH .../submissions/{learner_id}` for manual score and feedback. Auto-graded types fill scores themselves.
- Tracking summary on the list: `{ assigned, submitted, graded, avg_score }`.

### AI Assistant and Agnes companion (educator copilot)

- `POST /educator/assistant/chat` streams over SSE. Body `{ text, context: { route, class_id, learner_id?, topic_id? }, session_id? }`.
- The educator assistant uses **tool calling** with the registry: it can call read features such as `get_class_dashboard`, `get_weak_concepts`, `get_student_progress`, and write features only through a **propose then confirm** step (for example "generate a quiz on Trees" creates a draft job, "reschedule the test" returns a diff to confirm). It never changes data without a confirmation from the educator.
- Model: **Agnes**, at `interactive` priority, because tool calling with a 4B local model is unreliable. If Agnes is unavailable, fall back to the local model without tools, answering only from a data summary the backend prepares, and label the reply as limited.
- Answers cite the data they used (class, topic, learner) so the educator can check them.
- The floating companion bubble reuses this endpoint with the current route as context. `GET /educator/assistant/sessions` lists history.

### Next Best Actions (`GET /educator/next-actions?class_id=`)

```json
[ { "id", "kind": "review_submission|check_in|reteach_topic|generate_practice|approve_draft|resolve_conflict|follow_up_intervention",
    "priority": 1, "title": "Review John's assignment", "detail": "Submitted 2 days ago, not graded.",
    "learner_id": "", "topic_id": "", "cta": { "label": "Open submission", "route": "/assignments/..." },
    "status": "open" } ]
```

Actions are **rule generated** and stored in `next_actions`, refreshed by a background function on each dashboard load (at most once per minute per class). Rules to implement:

1. Submission waiting for grading for more than 24 hours.
2. Learner inactive for 3 or more days (suggest a check-in message).
3. Learner mastery dropped more than 10 points in a week.
4. Topic with class mastery below 50 (suggest re-teaching or generating practice).
5. Predicted gap on an upcoming topic.
6. Deadline within 48 hours with a low submission rate.
7. AI draft waiting for approval.
8. Conflict awaiting review.
9. Intervention follow-up due (section below).

`PATCH /educator/next-actions/{id}` sets `done` or `dismissed`. Titles and details come from templates, so no model call is needed. "Send a check-in message" opens a prefilled message the educator can edit; `POST /educator/messages` `{ learner_id, class_id, body, kind: "check_in" }` stores it, and the learner receives it via `GET /learner/notifications` (the learner screens have no inbox yet, so the front end needs a small notification list in the top bar).

### InterventionImpact

- `POST /educator/interventions` logs an intervention: `{ learner_id, class_id, type: "message|meeting|extra_material|assignment_adjustment|peer_pairing", topic_ids?, note }`. Creating one stores a **baseline snapshot** (14 day window before: mastery in the targeted topics or overall, weekly study minutes, assignment completion, recent scores). Messages sent from a next best action create an intervention automatically.
- `GET /educator/interventions?class_id=` lists them with status `tracking|measured`.
- `GET /educator/interventions/impact?class_id=` returns, per intervention, the baseline, the follow-up snapshot (14 days after, or what exists so far) and the deltas, with a label: `improved` when mastery rose 5 points or more, `declined` when it fell 5 points or more, otherwise `no_change`. It also returns a class summary: share improved, average mastery change, which intervention types worked best.
- `follow_up_due` creates a next best action 14 days after each intervention.
- This is pure arithmetic over `mastery`, `attempts`, `study_events` and `submissions`, with no model call. Seed three interventions with believable before and after values so the screen has data in the demo.

### Tables added by this section

`user.db`: `next_actions (id, educator_id, class_id, learner_id, topic_id, kind, title, detail, priority, status, cta json, created_at, resolved_at)`, `interventions (id, educator_id, learner_id, class_id, type, topic_ids json, note, baseline json, followup json, window_days, status, created_at, measured_at)`, `messages (id, from_id, to_id, class_id, kind, body, created_at, read_at)`, `educator_notes (educator_id, learner_id, class_id, note, created_at)`, `submissions (assignment_id, learner_id, status, score, answer json, transcript, feedback, submitted_at, graded_at)`, `assignment_distributions (assignment_id, class_id, learner_ids json, assigned_at, due_at)`, `assistant_sessions (user_id, role, context json, turns json, created_at)`.

### Which phase builds what

- **Phase 1 (for the 6 pm review):** StudyMaterials (upload, parse, chunk, list), Assignments (create, generate quiz draft, approve, distribute, submissions), Class Analytics (KPIs, struggling concepts), Students list and detail.
- **Phase 2 (overnight):** LearningPaths with suggestion and requirement change, Knowledge Graph, Next Best Actions, InterventionImpact, conflicts panel, the educator assistant with tools.

### Front-end additions this section requires

Three small additions to the educator UI so every required feature has a visible place: a conflicts panel in StudyMaterials, a "describe a change" box with a microphone button in LearningPaths, and a notifications list in the learner top bar. Without these, conflict resolution, voice intake and the check-in messages cannot be shown in the demo.

## 6. Feature registry

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

`ctx` holds the user, repositories, the LLM router and the clock, so features can be tested with fakes. Routes are under 15 lines and only call `call(...)`.

### Features

Educator: `ingest_source`, `parse_educator_intent`, `suggest_learning_paths`, `save_plan`, `publish_plan`, `request_generation`, `review_draft`, `get_class_dashboard`, `get_weak_concepts`, `get_student_progress`, `list_conflicts`, `override_conflict`, `apply_requirement_change`, `export_deck_pptx`.

`parse_educator_intent` takes a transcript from the browser's speech recognition and returns a structured proposal: goals, topics, counts, weightages, dates, or a change such as "exam moved to Friday". The educator confirms before anything is applied.

Learner: `get_dashboard` (subjects, due tasks, quick actions), `select_subject`, `set_intent`, `update_profile`, `get_core_path`, `get_enrichment`, `build_lesson`, `render_flashcards`, `start_rapid_fire`, `submit_rapid_fire_answer`, `start_assessment`, `submit_answer`, `submit_voice_explanation`, `get_mastery_landscape`, `voice_turn`.

Enrichment rule: show enrichment only when all required items for the current unit are `done`, or when the learner's intent is not `pass`.

## 7. LLM layer

### 7.1 Local profiles (Qwen3.5 4B, 6 GB VRAM laptop)

- `llama-server` runs natively. Q4_K_M GGUF from Hugging Face, all layers on the GPU, context 4096 to 8192. The backend only knows `LOCAL_URL` and the model name.
- `local_chat`: thinking off. Used for voice conversation.
- `local_reason`: same server with thinking on, only for math and code explanations. Check the model card for the exact switch.
- Strip any `<think>...</think>` block. Never speak it.
- Voice style prompt: two or three short sentences, spoken language, no markdown, lists or code, one idea at a time, end with a short follow-up question.

### 7.2 Router policy (config, not code)

| Task | Backend |
|---|---|
| `chat`, `rapid_fire_feedback`, `small_rewrite` | local chat |
| `explain_math`, `explain_code` | local reason, escalate to Agnes if a confidence check fails |
| `verify_claim`, `compare_sources`, `suggest_paths`, `parse_intent` | Agnes |
| `generate_slides`, `generate_quiz`, `generate_assignment`, `generate_assessment` | Agnes |
| `grade_conceptual`, `grade_voice_explanation` | Agnes |

If a local server is down, its tasks fall back to Agnes. If Agnes times out, verification is skipped and the answer is marked `verified=false`.

### 7.3 Agnes limiter (in memory)

- Token bucket at `AGNES_RPM` (default 10).
- Two priorities: `interactive` (voice verification, live grading) with `AGNES_INTERACTIVE_RESERVE` slots (default 6) and `background` (generation).
- Backoff with jitter on 429 and 5xx, honour `Retry-After`.
- Cache by hash of (model, messages, params) in a dict backed by a `cache` table.

### 7.4 Verification flow

```
learner text -> FTS5 retrieve chunks for the subject
  -> needs_verification()   # low retrieval score, claim outside sources, topic has a conflict, asks for recent facts
  -> if yes: Agnes verify_claim -> { verdict, corrected, evidence, citations }
  -> local chat writes the spoken answer from chunks + verification result, streamed by sentence
```

`needs_verification` is a deterministic function. Cache verified claims per subject.

## 8. Agents

Four agents share one base loop and run as background tasks. They call Agnes. Output is always a draft.

### 8.1 Base loop

`plan -> retrieve -> generate -> validate -> repair (max 1) -> save draft`

1. **Plan:** build a spec from the request (class, topics, counts, difficulty mix, kinds, marks, language, delivery notes). Defaults come from `educator_profiles.default_*`.
2. **Retrieve:** ranked chunks via FTS5, preferring educator material, then textbook, then others.
3. **Generate:** ask for JSON matching the agent's Pydantic schema.
4. **Validate (no LLM):** schema valid; every item has existing `source_chunk_ids` or is flagged `external`; counts, kind mix and marks match the spec; MCQ has exactly one correct option and no duplicates; near-duplicate items removed; marks and weightage add up.
5. **Repair:** send validation errors back once. If it still fails, save the draft with `validation_warnings` so the educator sees the problem.
6. **Save** the draft and emit progress events.

### 8.2 SlideAgent

Output: `{ title, slides: [{ layout, title, bullets (max 6), speaker_notes, diagram_prompt?, source_chunk_ids }] }`. One idea per slide. Speaker notes are required because the voice assistant reads them. `export_deck_pptx` renders `.pptx`.

### 8.3 QuizAgent

Input: topics, count, mix of `concept`, `application`, `industry`, difficulty. Items carry `kind`, `type`, `prompt`, `options`, `answer`, `explanation`, `difficulty`, `source_chunk_ids`. `industry` items describe a realistic scenario. Approved items go to `question_bank`, which also powers rapid fire.

### 8.4 AssignmentAgent

Types: `voice_explain`, `project`, `written`. Output: `brief`, deliverables, a machine readable `rubric` (criteria, weights, level descriptors) and, for voice assignments, `key_points` a good answer should cover. The rubric is what grading uses.

### 8.5 AssessmentAgent

Input: blueprint (topics, marks per topic, kind mix, duration, exam style). Output: sections, items with marks, marking scheme, and a `coverage` table. Validation checks marks per topic against the blueprint and total marks against the plan.

### 8.6 Review flow

`GET /educator/drafts`, `PATCH /educator/drafts/{id}`, `POST /educator/drafts/{id}/approve` (copies to the final table and bumps `version`), `POST /educator/drafts/{id}/reject` (stores notes for regeneration).

## 9. Voice assistant (main learner feature)

Speech to text and text to speech run in the browser. The backend receives text.

- `POST /learner/voice/turn` body `{ subject_id, session_id?, text }`. Response is SSE: `sentence` events, then `done { verified, citations, followups, external }`.
- Pipeline: last 6 turns, top chunks for the subject, `needs_verification`, optional Agnes verification, local streaming answer, save turn.
- Answers stay inside the subject's material. A general question is answered but labelled `external`.
- Personalization inputs for each turn: `reading_level`, `explanation_depth`, `content_language`, and the learner's weak topics. These shape the system prompt.
- Math and code questions use the `local_reason` profile.
- Voice assignments: `POST /learner/assignments/{id}/voice-submission` with the transcript. Grade against rubric and key points, write an `attempt`, update `mastery`.
- Every voice action works with typed text too.

## 10. Engines (pure functions with unit tests)

- **Mastery:** `m += lr * (correct - m)`, with `lr` concept 0.35, application 0.35, industry 0.30, exam 0.30, mcq 0.25. Decay `m *= exp(-days/21)`. Seed from `prior_knowledge`.
- **Predicted gaps:** for each topic due in the next 14 days, `readiness = min(mastery(T), mean(mastery(prereqs)))`. Below 0.55 is a gap. `apply_requirement_change` and the dashboard insert a remedial item on the weakest prerequisite and store the reason.
- **Weak concepts:** per class and topic, mean mastery, error rate by kind, and share of learners below 0.5. Misconception summaries come from wrong conceptual and voice answers and are cached.
- **Trust:** `0.4*authority + 0.3*recency + 0.3*agreement`. Authority: educator notes 1.0, textbook 0.8, slides 0.7, web link 0.4. Winner chosen automatically, reason stored, educator override is permanent for that claim.
- **Adaptation:** `build_lesson` and voice prompts use the learner's modalities, reading level, depth, pace and mastery to choose format order, explanation level and example type.

## 11. Endpoints (summary)

Auth: `POST /auth/register`, `/auth/login`, `/auth/logout`, `GET /auth/me`, `PATCH /me/profile`.

Educator: `POST /educator/intent`, `POST /educator/sources`, `GET /educator/sources`, `POST /educator/paths/suggest`, `PUT /educator/plan`, `POST /educator/plan/publish`, `POST /educator/plan/change`, `POST /educator/generate`, `GET|PATCH /educator/drafts`, `POST /educator/drafts/{id}/approve|reject`, `GET /educator/dashboard`, `GET /educator/weak-concepts`, `GET /educator/learners/{id}`, `GET /educator/conflicts`, `POST /educator/conflicts/{id}/override`, `GET /educator/decks/{id}/export`.

Learner: `GET /learner/dashboard`, `PUT /learner/subject-settings`, `GET /learner/path`, `GET /learner/enrichment`, `GET /learner/lesson/{topic_id}`, `GET /learner/flashcards/{topic_id}`, `POST /learner/rapid-fire/start|answer`, `POST /learner/assess/start|answer`, `POST /learner/voice/turn`, `POST /learner/assignments/{id}/voice-submission`, `GET /learner/landscape`.

Shared: `GET /jobs/{id}`, `GET /jobs/{id}/events`, `GET /healthz`.

## 12. Build order

Work in three parallel streams once Phase 0 is done: **A** database and routes, **B** LLM layer and agents, **C** voice and engines. Stop at the end of each phase and run its checks.

**Phase 0 (about 45 min). Contract.** The front end summary is already in section 5b. Verify it against the real repository, write all Pydantic schemas and `docs/api-contract.md` from section 5b, and list any mismatch. Replace each `mockData.js` entry with a seed row that produces the same response shape. Run `scripts/smoke_agnes.py`: one real Agnes call, check whether streaming works and whether a strict JSON mode works, and print the result. Start `llama-server` with the script and confirm a streamed reply. Run `scripts/bench_local.py` for speed.

**Phase 1 (for the 6 pm review). One working path.**
1. Settings, both databases created, tables, seed data (one educator, three learners with varied profiles, two subjects, topics with prerequisites, sample sources).
2. Login with two roles, `me`, profile update.
3. Registry and the LLM router with the limiter.
4. `ingest_source` (PDF and text), chunking, FTS5.
5. QuizAgent, draft review and approve, `question_bank`.
6. `publish_plan` and `get_dashboard` for the learner.
7. `voice_turn` with retrieval, verification and streaming.
8. `submit_answer`, mastery update, `get_class_dashboard` showing the weak topic.

Also in this phase, build the seed described in 5c, and make `GET /learner/dashboard`, `GET /learner/progress`, `GET /exam/overview` and `GET /voice/options` return the shapes in 5c. Also: `GET /subjects`, `GET /subjects/{id}`, `GET /learn/...`, `GET /learner/tasks` and `GET /learner/dashboard` return the exact shapes in section 5b so the front end can swap off `mockData.js`.

Check: an educator uploads a file, generates and approves a quiz, a learner asks a voice question and answers the quiz, and the educator dashboard shows the weak topic. The learner screens load real data with no front-end component changes beyond the data source.

**Phase 2 (overnight). Remaining features, in this order.**
1. `parse_educator_intent` and `suggest_learning_paths`.
2. SlideAgent with export, AssignmentAgent, AssessmentAgent.
3. Gap prediction, `apply_requirement_change`, remedial items.
4. Trust scoring and conflict cards with override.
5. Flashcards with spaced repetition, practice exams, games and achievements, `submit_voice_explanation`, enrichment unlock, calendar and progress endpoints.
6. Mastery landscape endpoint and learner subject settings.
7. Adaptation of lessons and voice prompts to the learner profile.

**Phase 3 (last two hours). Demo hardening.**
1. Pre-generate and save fallback outputs, flag `is_fallback`.
2. Seed a deliberate source conflict and a learner who is behind.
3. Check error handling: Agnes down, local model down, no microphone.
4. Run the demo script twice, fix only what breaks.

## 13. Demo script

1. Educator speaks a rough goal and a requirement ("exam moved to Friday"), confirms the parsed plan.
2. Educator uploads three messy sources, one contradicting another. A conflict card shows which source won.
3. Educator generates a deck, a quiz, an assignment and an assessment, reviews and approves them, edits weightages and publishes.
4. Learner opens the dashboard, picks a subject, sets intent, uses the voice assistant, switches the lesson to flashcards, plays rapid fire.
5. Learner gets a conceptual voice question wrong. A gap is predicted, the path replans with a remedial item.
6. Educator dashboard shows the weak concept and the learner's progress by question kind.

## 14. Environment variables

```
SECRET_KEY=
USER_DB_URL=sqlite:///./data/user.db
COURSE_DB_URL=sqlite:///./data/course.db
LOCAL_URL=http://127.0.0.1:8081/v1
LOCAL_MODEL=qwen3.5-4b
AGNES_API_KEY=            # server only
AGNES_BASE_URL=https://apihub.agnes-ai.com/v1
AGNES_TEXT_MODEL=agnes-3.0-flash
AGNES_IMAGE_MODEL=agnes-image-2.5flash
AGNES_RPM=10
AGNES_INTERACTIVE_RESERVE=6
CORS_ORIGINS=
```

## 15. Rules for the coding agent

- Follow the phase order. Do not add anything not listed here.
- Route handlers stay under 15 lines. Logic goes in features and engines.
- Write unit tests for mastery, gaps, trust and each agent validator. Skip other tests unless time remains.
- If this guide and the front end disagree, record the mismatch in `docs/api-contract.md` and keep going with the front end's shape.
- Prefer the simplest working code. Do not add abstractions that the demo does not need.
