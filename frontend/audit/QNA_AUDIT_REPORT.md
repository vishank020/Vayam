# Q&A Feature Audit Report

**Generated**: 2026-06-17 | **Scope**: Full stack (backend + frontend), static analysis
**Backend availability**: Not running — all analysis from source

---

## Backend

### Endpoint Inventory

| Endpoint | Method | Exists | Notes |
|---|---|---|---|
| `/api/questions` | GET | ✅ | Paginated, sorted by `createdAt DESC` |
| `/api/questions` | POST | ✅ | Create question (title + body) |
| `/api/questions/{id}` | GET | ✅ | Single question with answers |
| `/api/questions/{id}` | DELETE | ✅ | Author only |
| `/api/questions/{id}/answers` | POST | ✅ | Answer question (body + optional draft flag) |
| `/api/questions/{id}/answers/{answerId}` | PUT | ✅ | Edit answer (author only) |
| `/api/questions/{id}/answers/{answerId}` | DELETE | ✅ | Delete answer (author only) |
| `/api/questions/{id}/answers/{answerId}/accept` | PUT | ✅ | Accept answer (question author only) |
| `/api/questions/answers/drafts` | GET | ✅ | Authenticated user's draft answers |

**Missing endpoints:**
- `PUT /api/questions/{id}` — **Edit question** — no endpoint to update a question title/body
- `GET /api/questions/search?q=...` — **No search/filter** for questions
- `POST /api/questions/{id}/vote` / `POST /api/questions/{id}/answers/{answerId}/vote` — **No voting on questions or answers**
- `POST /api/questions/{id}/answers/{answerId}/comments` — **No comments on answers**
- `POST /api/questions/{id}/comments` — **No comments on questions**
- `GET /api/questions/tags` — **No tag endpoints** (tags not migrated)

### Controller (`QnaController.java:95`)

- ✅ Clean REST design with consistent `/api/questions` base path
- ✅ CRUD for questions + answers complete except question edit
- ✅ JSR-303 validation on request bodies
- ✅ `AuthPrincipal` extracted from `SecurityContextHolder` (same pattern as rest of codebase)
- ⚠️ `getPrincipal()` is duplicated — this pattern appears in multiple controllers (could be extracted to a utility)
- ⚠️ `PUT /{id}/answers/{answerId}/accept` returns `ResponseEntity.ok().build()` (no body) → acceptable for void response
- ⚠️ No `GET /api/questions/answers/drafts` endpoint on the controller — wait, yes there is at line 75-80

### Service (`QnaService.java:205`)

- ✅ Business logic for question/answer CRUD
- ✅ Answer acceptance — un-accepts all others when accepting one (only one accepted answer allowed)
- ✅ Draft support with `AnswerStatus.DRAFT`/`PUBLISHED` toggle
- ✅ `answerCount` denormalized on `Question` — incremented/decremented on create/delete
- ⚠️ **No answer edit form validation** — `answerQuestion` and `updateAnswer` both accept `AnswerQuestionRequest.body` without size limits (`@NotBlank` only)
- ⚠️ **No ownership check on question list** — `listQuestions` correctly tags `isAuthor` per question, but there's no `GET /api/questions/mine` for "my questions"
- ⚠️ `acceptAnswer` uses `IllegalArgumentException` for business logic errors — `GlobalExceptionHandler` maps these to 400 Bad Request, but they're semantically 403 (not owner) or 404 (not found). Should use proper exception types (`AccessDeniedException`, `EntityNotFoundException`).
- ⚠️ `acceptAnswer` doesn't cascade the `QnaService.acceptAnswer` denormalized count change — accepted status doesn't affect `answerCount`, but that's correct since answer count is total count regardless of acceptance.

### Entities

**Question** (V5 migration + `Question.java`)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| title | VARCHAR(200) | Max 200 chars |
| body | TEXT | Required |
| author_id | UUID FK→users | |
| answer_count | INTEGER | Denormalized, default 0 |
| created_at | TIMESTAMPTZ | `update_updated_at_column()` trigger |
| updated_at | TIMESTAMPTZ | Trigger auto-update |

**Answer** (V5 + V41 migration + `Answer.java`)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| question_id | UUID FK→questions | ON DELETE CASCADE |
| body | TEXT | Required |
| author_id | UUID FK→users | |
| is_accepted | BOOLEAN | Default FALSE |
| status | VARCHAR(10) | V41 migration, default 'PUBLISHED' |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Observations:**
- ✅ Questions and answers both use `Instant` for timestamps (correct per conventions)
- ✅ Author relationship is `@ManyToOne(fetch = FetchType.LAZY)` — good practice
- ✅ Cascade delete on answers when question is deleted
- ⚠️ **No tags** on questions — no tags column, no tag entity, no join table
- ⚠️ **No view count** — questions don't track views
- ⚠️ **No vote count** — no upvote/downvote infrastructure
- ⚠️ **No slug** — questions identified only by UUID, no SEO-friendly URL

### Repositories

**`QuestionRepository`**: Only `findAllByOrderByCreatedAtDesc(Pageable)` — minimal. Missing:
- Search by title/body (full-text)
- Find by author (user's questions)
- Find by tags

**`AnswerRepository`**: Properly filters by `status = 'PUBLISHED'` for public queries, `status = 'DRAFT'` for user drafts. Missing:
- Find by author (user's answers)
- Vote counts

---

## Frontend

### `QnaService` (frontend, `qna.service.ts:73`)

| Method | Endpoint | Exists | Used By |
|---|---|---|---|
| `askQuestion()` | POST `/api/questions` | ✅ | AskQuestionComponent |
| `listQuestions()` | GET `/api/questions?page=&size=` | ✅ | QuestionListComponent |
| `getQuestion()` | GET `/api/questions/{id}` | ✅ | QuestionDetailComponent |
| `answerQuestion()` | POST `/api/questions/{id}/answers` | ✅ | QuestionDetailComponent |
| `updateAnswer()` | PUT `/api/questions/{id}/answers/{answerId}` | ✅ | **Not used anywhere** |
| `deleteAnswer()` | DELETE `/api/questions/{id}/answers/{answerId}` | ✅ | **Not used anywhere** |
| `acceptAnswer()` | PUT `/api/questions/{id}/answers/{answerId}/accept` | ✅ | QuestionDetailComponent |
| `getAnswerDrafts()` | GET `/api/questions/answers/drafts` | ✅ | DraftsPageComponent |
| `deleteQuestion()` | DELETE `/api/questions/{id}` | ✅ | QuestionDetailComponent |

**Missing service methods:**
- **`updateQuestion()`** — no method for editing question (no backend endpoint either)
- **`searchQuestions()`** — no search capability
- **`voteQuestion()`** / **`voteAnswer()`** — no voting methods

### `QuestionListComponent` (`question-list.component.ts:133`)

| Aspect | Status | Notes |
|---|---|---|
| Load questions | ✅ | Paginated via `listQuestions(page, size)` |
| Sort | ✅ | Backend sorts by `createdAt DESC` (newest first) |
| Filter | ❌ | No search, no tag filter, no status filter (answered/unanswered) |
| Body preview | ⚠️ | Uses `slice:0:150` pipe on raw body text — no Markdown stripping, could show markdown syntax in preview |
| Pagination | ✅ | Previous/Next with page counter |
| Anonymous intercepted | ✅ | "Ask Question" button intercepted via `AnonymousBrowsingService` |
| Date display | ⚠️ | Uses `date:'mediumDate'` pipe instead of `timeAgo()` — violates AGENTS.md convention |
| Error state | ✅ | Shows error message on failure |
| Empty state | ✅ | "No questions yet" placeholder |
| Loading state | ✅ | "Loading questions..." spinner |

### `AskQuestionComponent` (`ask-question.component.ts:105`)

| Aspect | Status | Notes |
|---|---|---|
| Title field | ✅ | Required, min 5 chars |
| Body field | ✅ | Required, plain textarea with 6 rows |
| Validation | ✅ | Template-driven with inline error messages |
| Markdown editor | ❌ | Uses plain `<textarea>` — no MarkdownEditorComponent integration |
| Tags | ❌ | No tag input |
| Draft save | ❌ | No autosave or draft button |
| Error display | ✅ | Shows API error message |
| Loading state | ✅ | Submit button shows "Posting..." |
| Redirect on success | ✅ | Navigates to `/questions/{id}` |
| Anonymous intercept | ❌ | No `AnonymousBrowsingService.interceptAction()` call (route is guarded by `authGuard`, so only authenticated users can reach it — acceptable) |

### `QuestionDetailComponent` (`question-detail.component.ts:172`)

| Feature | Status | Notes |
|---|---|---|
| Display question | ✅ | Title + body + metadata |
| Display answers | ✅ | Listed with accepted styling |
| Accept answer | ✅ | Button shown only to question author, only on unaccepted answers |
| Delete question | ✅ | Author only, with `confirm()` dialog |
| Submit answer | ✅ | Posts answer, then reloads question |
| Save answer draft | ✅ | Uses `saveAsDraft: true` flag |
| Edit answer | ❌ | No edit button or mode — despite backend and service supporting it |
| Delete answer | ❌ | No delete button — despite backend and service supporting it |
| Edit question | ❌ | No edit button — no backend endpoint either |
| Vote answers | ❌ | No voting UI |
| Vote question | ❌ | No voting UI |
| Markdown rendering | ❌ | Body rendered as `{{ question.body }}` — plain text, no `marked` library |
| Comments on answers | ❌ | No comment system for answers |
| Comments on questions | ❌ | No comment system for questions |
| Share question | ❌ | No share/copy-link button |
| Report question/answer | ❌ | No report functionality |
| Anonymous intercept | ✅ | Answer submission checks via `interceptAction()` |
| Date display | ⚠️ | Uses `date:'mediumDate'` pipe instead of `timeAgo()` |
| Answer draft editing | ❌ | Can save drafts but cannot resume editing them in context |

### `DraftsPageComponent` (referenced)

- ✅ Lists answer drafts alongside post drafts
- ✅ Links to `/questions/{questionId}` — does not restore to the answer editor, just navigates to the question page

---

## Data Flow Summary

```
Question List (GET /api/questions?page=0&size=20)
    ↓ click question card
Question Detail (GET /api/questions/{id})
    ↓ answers embedded in response
    ↓ submit answer (POST /api/questions/{id}/answers)
    ↓ accept answer (PUT /api/questions/{id}/answers/{answerId}/accept)
    ↓ delete question (DELETE /api/questions/{id})
    No → edit answer (PUT  /api/questions/{id}/answers/{answerId})
    No → delete answer (DELETE /api/questions/{id}/answers/{answerId})
    No → edit question (PUT /api/questions/{id})
```

---

## Gaps (ranked by user impact)

| # | Gap | Component | Severity | Impact |
|---|---|---|---|---|
| G1 | **Edit question not implemented** (no backend endpoint, no frontend UI) | Global | **Critical** | Users cannot fix typos or update their questions |
| G2 | **Delete answer not implemented in UI** (backend + service exist, but QuestionDetailComponent has no delete button) | QuestionDetailComponent | **High** | Users cannot remove their own answers |
| G3 | **Edit answer not implemented in UI** (backend + QnaService.updateAnswer exist, but no edit button in QuestionDetailComponent) | QuestionDetailComponent | **High** | Users cannot fix or update their answers |
| G4 | **No voting on questions or answers** | Global | **Medium** | No community moderation or ranking of content; no way to surface good answers |
| G5 | **No Markdown rendering** for question body and answer body — rendered as plain text with `{{ }}` | QuestionDetailComponent | **Medium** | Users lose formatting (code blocks, lists, bold, links) in questions and answers |
| G6 | **No Markdown editor on ask/edit question** — plain `<textarea>` instead of `MarkdownEditorComponent` | AskQuestionComponent | **Medium** | Users have no Write/Preview tabs, toolbar, or formatting aids |
| G7 | **No search/filter** on question list | QuestionListComponent | **Medium** | Users cannot find specific questions by keyword or filter by answered/unanswered |
| G8 | **No tags** on questions (backend migration + entity + endpoints missing) | Global | **Medium** | No categorization or topic filtering |
| G9 | **Date uses `date:'mediumDate'` pipe** instead of `timeAgo()` | QuestionListComponent, QuestionDetailComponent | **Low** | Inconsistent with rest of app (feed, comments); violates AGENTS.md convention |
| G10 | **No reload after answer submission** — calls `loadQuestion()` which refetches the whole question; acceptable but no optimisitic update | QuestionDetailComponent | **Low** | Brief flicker on answer reload |
| G11 | **Body preview shows raw HTML/Markdown** in question list (`slice:0:150` on raw body) | QuestionListComponent | **Low** | Preview may show markdown syntax (e.g., `**bold**`) instead of clean text |
| G12 | **No comment system** on questions or answers | Global | **Low** | Users cannot discuss answers or request clarification |
| G13 | **No question slug/SEO URL** | Global | **Low** | UUID URLs are not user-friendly or shareable |
| G14 | **No view tracking** | Global | **Low** | Cannot see popularity of questions |
| G15 | **No report functionality** for questions or answers | Global | **Low** | Users cannot flag inappropriate Q&A content |

---

## Recommendations (Top 5, ordered)

### 1. Implement edit question (backend + frontend)
- Add `PUT /api/questions/{id}` endpoint to `QnaController`
- Add `updateQuestion()` to `QnaService` (validate ownership, update title/body)
- Add `updateQuestion()` to frontend `QnaService`
- Add "Edit" button in `QuestionDetailComponent` that navigates to an edit view (or inline editor)
- **Effort**: Low (pattern already exists for answer editing)

### 2. Wire delete answer and edit answer in QuestionDetailComponent
- Add "Edit" and "Delete" buttons on each answer when `a.isAuthor === true`
- Delete: call `QnaService.deleteAnswer()` with confirmation dialog
- Edit: provide inline textarea or navigate to an edit view; call `QnaService.updateAnswer()`
- **Effort**: Low (backend + service already complete)

### 3. Add Markdown rendering + editor integration
- Replace `{{ question.body }}` and `{{ a.body }}` with `MarkdownEditorComponent` preview rendering (use `marked` library like post detail does)
- Replace plain `<textarea>` in `AskQuestionComponent` with `MarkdownEditorComponent`
- **Effort**: Medium (requires template changes and component integration)

### 4. Add voting on questions and answers
- Add `post_votes`-style table for questions and answers (or reuse existing vote infrastructure)
- Add backend endpoints + frontend vote buttons (upvote/downvote)
- Show vote count in question list and detail
- **Effort**: Medium-High (new migration, entity, service, component)

### 5. Add search/filter to question list
- Add backend GIN-indexed full-text search on questions (title + body), similar to the search service
- Add filter tabs: "Newest", "Unanswered", "Most Voted"
- Add search bar to `QuestionListComponent`
- **Effort**: Medium

---

## Summary Statistics

| Category | Count |
|---|---|
| Backend endpoints | 9 total, 8 complete, 1 missing (`PUT question`) |
| Frontend service methods | 9 total, 2 unused (`updateAnswer`, `deleteAnswer`) |
| Frontend components | 3 components |
| Features implemented (frontend) | 8 (list, view, ask, answer, accept, delete question, draft answer, answer draft list) |
| Features partially implemented | 2 (answer edit + delete exist in service but not wired in UI) |
| Features missing completely | 11 (question edit, voting, markdown render, markdown editor on ask, search/filter, tags, comments, slugs, views, reports, question share) |
| Bugs | 0 definite (static analysis) |
| Convention violations | 1 (`date` pipe instead of `timeAgo()` in 2 components) |
