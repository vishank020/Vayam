# Vayam — AGENTS.md

Package: `com.community` | Stack: Spring Boot 3.2 (source Java 17, runtime Java 21) + Angular 18 + PostgreSQL 16 + Maven

---

## Non-Obvious Conventions

- **DTOs**: All request/response DTOs are Java Records. Old entities (pre-AGENTS.md) use manual getters/setters.
- **UserResponse follow fields**: Boxed `Long followerCount`, `Long followingCount`, `Boolean isFollowing` (null when unauthenticated).
- **Date types**: `java.time.Instant` everywhere. Never `LocalDateTime` or `Date`.
- **FK patterns**: Mixed. Some entities use raw UUID fields (`Post.userId`), others use `@ManyToOne` (Community.owner, UserProfile.user). Match the entity you're editing.
- **JWT auth**: HttpOnly cookies (`access_token` + `refresh_token`). Both `Authorization: Bearer` header and cookies accepted. Frontend never touches tokens — uses `GET /api/auth/me` for auth state. `auth.interceptor.ts` is a function-based interceptor (not class-based) that calls `next(req.clone({ withCredentials: true }))`.
- **Migrations**: `V{n}__{description}.sql` — never edit existing ones. `CREATE OR REPLACE FUNCTION update_updated_at_column()` trigger helper in V1. Currently 36 migrations applied (V1–V36, no gaps).
- **Error responses**: `ErrorResponse` record `{status, error, message, timestamp}` via `GlobalExceptionHandler`. Validation errors return a `Map` with `ErrorResponse` fields + `errors` key.
- **Anonymous browsing**: Public feed endpoints don't require auth. Anonymous posts require `is_anonymous=true` + row in `post_anonymous_map`. That table is NEVER joined in public queries.
- **Anonymous toggle on edit**: `PostService.updatePost()` creates/deletes `post_anonymous_map` accordingly.
- **Flyway only**: `ddl-auto: validate`. Never `create` or `update`.
- **CORS**: `CorsFilter` bean in `CorsConfig.java`. No `.cors()` in SecurityConfig (bean auto-registers anyway). No `@CrossOrigin` on controllers.
- **Logout**: `POST /api/auth/logout` clears HttpOnly cookies via `Max-Age=0`.
- **WebSocket (STOMP)**: Endpoint `/ws` with SockJS, prefixes `/topic`, `/queue`. Frontend uses `@stomp/stompjs`.
- **Relative timestamps**: `timeAgo()` from `core/time-ago.ts` — returns "just now", "2m ago", "5h ago", "1w ago", "2mo ago", "1y ago". No Angular `Date` pipe for relative display.
- **Edited post detection**: `updatedAt > createdAt + 1s`. Yellow **Edited** badge with "Edited 2h ago".
- **Comment `isAuthor`**: `CommentResponse` includes `boolean isAuthor` (per-request). Frontend shows delete button on hover.
- **Block idempotency**: `BlockService.block()` returns silently if already blocked. One-directional — feed filtering excludes blocked users' posts from `getFeed()` only (not community feed).
- **Report column**: `reports` table uses `reported_user_id` (not `reported_id`). V16 migration.
- **`by-username` endpoint**: `GET /api/users/by-username/{username}` is `permitAll`. Principal extracted from `SecurityContextHolder` directly (no `@AuthenticationPrincipal` on `permitAll` endpoints).
- **No Lombok in new code**: New/changed services (BlockService, ReportService, FollowService rewrite, NotificationService) use explicit constructor injection.
- **Markdown**: `marked@14.1.4` library for rendering. `MarkdownEditorComponent` at `features/shared/markdown-editor/` with Write/Preview tabs, toolbar (B/I/Link/Code/Quote/Lists), exposes `cursorPos`, `insertAtCursorPos()`, `editorKeydown`, `focus()` for mention/GIF integration.
- **PostgreSQL enum cast issue**: `post_type` and `notification_type` are native enums. `@Enumerated(EnumType.STRING)` sends VARCHAR which PostgreSQL rejects without the implicit cast in V9/V13.
- **Responsive design system**: CSS variables in `styles.css` for layout tokens (`--header-height`, `--container-max-width`), spacing scale (`--sp-xs` through `--sp-2xl`), font scale (`--fs-xs` through `--fs-title`), and safe area (`--safe-top/bottom/left/right`). Responsive typography at 767/1023px. Ultrawide cap at 1440px (900px container) and 1920px (1000px container). Touch targets 44px via `@media (pointer: coarse)`. No component CSS duplication — use `var(--*)` everywhere, never hardcoded values.
- **Sidebar responsive**: `SidebarService` (core/sidebar.service.ts) with RxJS Subject for global open/close/toggle state. Sidebar uses `translateX(-100%)` overlay + backdrop at ≤1023px. Route-change (NavigationEnd), backdrop click, and Escape key close it. Hamburger button in header shown only ≤1023px.
- **Responsive breakpoints**: 0–767px mobile (full-width, stacked layout), 768–1023px tablet (partial adjustments), 1024px+ desktop (standard layout), 1440px+ ultrawide (wider container), 1920px+ (max container). All responsive CSS lives inline in component `styles: []` arrays.
- **`flex-wrap: wrap` pattern**: All flex container headers, meta lines, and action bars use `flex-wrap: wrap` to avoid horizontal overflow at any width.
- **`max-width: 100%` on media**: Global rule for `img, video, iframe, embed` prevents media overflow. Components additionally cap media preview heights on mobile (250px max in feed, reduced iframe heights in post detail).
- **Notification `actorId`**: V24 replaced `actor_username` column with `actor_id` (UUID FK to users). `actorUsername` is resolved at query time via `UserRepository.findById()`.
- **`String[]` → `TEXT[]` mapping**: `Post.mediaUrls` is `String[]` mapped to `TEXT[]` using Hibernate 6's native PostgreSQL array mapping.
- **Two-Factor Authentication**: Enabled under Settings -> Security using TOTP. If enabled, the login endpoint returns a temporary token (`tempToken`) and `requires2fa = true`. The user must submit the OTP code and `tempToken` to `/api/auth/login/verify` to complete authorization.
- **Email verification**: On registration, a verification email is sent asynchronously. Email change now creates a CHANGE_EMAIL token and requires verification via link click before the hash is updated. No email-verification flow existed before — V49 migration added `email` and `email_verified` columns + `email_verification_tokens` table.
- **Mute User**: One-directional silence of posts and notifications via `POST/DELETE /api/users/{userId}/mute`. Mutes prevent notification generation and hide posts from global/community feeds.
- **Accent Color**: Dynamic accent color customizer stored in `user_settings` and injected dynamically into the frontend as a CSS `--primary` custom variable.

---

## Commands

```bash
# Start services (PostgreSQL :5434 + MinIO :9000)
docker-compose up -d

# Backend (port 8080)
cd backend
$env:DB_USERNAME="community_user"; $env:DB_PASSWORD="community_pass"; $env:DB_URL="jdbc:postgresql://localhost:5434/community_db"; $env:JWT_SECRET="change-me-at-least-32-chars-long!"; $env:ENCRYPTION_SECRET="change-me-at-least-32-chars-long!"; $env:GIPHY_API_KEY=""; mvnw.cmd spring-boot:run

# Frontend (port 4200)
cd frontend
ng serve

# Build both
cd backend; mvnw.cmd package -DskipTests
cd frontend; ng build
```

## CI (GitHub Actions)

`.github/workflows/build.yml` runs on push/PR to `main`:
- **Backend**: JDK 17 (temurin), `./mvnw verify -DskipTests --batch-mode`
- **Frontend**: Node 20, `npm ci`, `npx ng build`

No tests exist yet (both `skipTests: true` and zero `.spec`/`Test.java` files). Pipeline is build-only.

**JWT_SECRET and ENCRYPTION_SECRET must each be ≥32 bytes** or JJWT throws `WeakKeyException`. GIPHY_API_KEY can be empty (GIF picker degrades gracefully).

## Production

### Infrastructure (docker-compose.prod.yml)

| Service | Image | Role |
|---|---|---|
| `postgres` | postgres:16-alpine | Database, port 5432 (internal) |
| `minio` | minio:latest | File storage, port 9000 (internal) |
| `backend` | Dockerfile (backend/) | Spring Boot API, port 8080 (internal) |
| `frontend` | Dockerfile (frontend/) | Nginx → Angular static + proxy `/api` & `/ws` to backend, ports 80/443 |

### Environment Variables (`.env`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DOMAIN` | Yes | — | `https://your-domain.com` |
| `DB_PASSWORD` | Yes | — | Auto-generated by deploy script |
| `JWT_SECRET` | Yes | — | ≥32 bytes, auto-generated |
| `ENCRYPTION_SECRET` | Yes | — | ≥32 bytes, auto-generated |
| `MINIO_ROOT_PASSWORD` | Yes | — | Auto-generated |
| `GIPHY_API_KEY` | No | empty | Degrades gracefully |
| `MAIL_HOST` | Yes | smtp.sendgrid.net | SMTP server for email sending |
| `MAIL_PORT` | Yes | 587 | SMTP port (TLS) |
| `MAIL_USERNAME` | Yes | apikey | SendGrid uses "apikey" as username |
| `MAIL_PASSWORD` | Yes | — | SendGrid API key or SMTP password |
| `MAIL_FROM` | Yes | noreply@vayam.app | From address for outgoing emails |

### Security Notes

- `COOKIE_SECURE=true` in prod (set in docker-compose.prod.yml)
- `server.forward-headers-strategy: framework` in `application-prod.yml` — Spring Boot trusts X-Forwarded-Proto from Nginx
- CORS is effectively irrelevant behind Nginx (same-origin), but `CORS_ALLOWED_ORIGIN` still set to the domain for correctness
- All ports internal except 80/443 on the frontend container
- Database backups: `scripts/db-backup.sh` (pg_dump → local file + MinIO)

### Local Dev vs Prod

| Concern | Dev (`docker-compose up -d`) | Prod (`docker-compose.prod.yml`) |
|---|---|---|
| DB port | Exposed on 5434 | Internal only |
| MinIO ports | 9000 + 9001 exposed | Internal only |
| Backend | Runs via `mvnw spring-boot:run` | Docker container (env vars from `.env`) |
| Frontend | Runs via `ng serve` (proxy.conf.json) | Nginx container serving `dist/` |
| Cookies | `COOKIE_SECURE=false` | `COOKIE_SECURE=true` |
| CORS origin | `http://localhost:4200` | `$DOMAIN` |

---

## API Gotchas

- `POST /api/auth/login` expects `username` (not `email`). `LoginRequest` validates `@NotBlank` on `username`.
- `POST /api/auth/register` hashes email SHA-256 server-side. `email` param is raw, stored as hash.
- In PowerShell, inline `-d '{"key":"value"}'` mangles JSON. Use `-d "@file.json"`.
- `GET /api/auth/me` works with cookie OR `Authorization: Bearer`. Returns 401 if no principal.
- Docker Postgres on port **5434** (not 5432).
- `PUT /api/posts/{id}` accepts `CreatePostRequest` body including `isAnonymous` toggle.
- `CommentResponse` includes `isAuthor` boolean for delete button visibility.
- `GET /api/users/by-username/{username}` returns `isFollowing: null` when unauthenticated, `true/false` when authenticated.
- Block endpoints (`POST/DELETE /{userId}/block`) are idempotent and one-directional.
- Follow debug endpoint `POST /api/users/follow/{userId}` has been removed (duplicate of `POST /{userId}/follow`).
- Notification endpoints (`GET /`, `GET /unread-count`, `PUT /{id}/read`, `PUT /read-all`) all require auth.
- `POST /api/auth/register` hashes email SHA-256 server-side. `email` param is raw, stored as hash.
- `POST /api/auth/register` now stores raw email + sends async verification. `GET /api/auth/verify-email?token=xxx` marks it verified.
- `PUT /api/auth/email` creates a CHANGE_EMAIL token and emails a verification link. Email hash is only updated after link click.
- `POST /api/auth/forgot-password` always returns 200 (prevents email enumeration). Sends reset link if email exists.
- `POST /api/auth/reset-password` accepts `{ token, newPassword }`. Token is single-use, expires after 1 hour.
- `POST /api/users/{id}/report` stores in `reported_user_id` column. Accepts `@NotBlank @Size(max=1000) String reason`.
- `PUT /api/auth/username` and `PUT /api/auth/email` require `currentPassword` + new value. Returns 401/403 on wrong password, 400 on validation/uniqueness failure.

---

## Security Config (all auth here, no `@PreAuthorize`)

| Pattern | Access |
|---|---|
| `/api/auth/**`, `/ws/**` | permitAll |
| `GET /api/users/*/followers`, `*following`, `*follow-counts`, `*is-following` | permitAll |
| `/api/anonymous/**`, `/api/communities/**`, `/api/questions/**`, `/api/posts/**` | permitAll |
| `GET /api/search` | permitAll |
| `GET /api/users/by-username/**`, `GET /api/users/*/projects` | permitAll |
| `GET /api/storage/download/**` | permitAll |
| `/api/notifications/**`, `/api/settings/**` | authenticated |
| `/api/users/**` | authenticated |
| All other requests | authenticated |

---

## Repo Layout

| Backend package | Key contents |
|---|---|
| `auth/` | JWT filter, controller, service, token provider, principal record |
| `user/` | User + UserProfile entities, repos, DTOs, controller |
| `config/` | SecurityConfig, CorsConfig, WebSocketConfig, GlobalExceptionHandler |
| `post/` | CRUD, feed, anonymous, saves, upvotes, unified action bar |
| `comment/` | CRUD, nested replies, `isAuthor` logic |
| `notification/` | Notifications, real-time STOMP push |
| `follow/` | Follow/unfollow, lists, counts, block guard |
| `block/` | Idempotent block/unblock, feed filter |
| `report/` | Report creation |
| `community/` | CRUD, members, invites, roles (OWNER/MOD/MEMBER) |
| `dm/` | Conversations, messages, STOMP chat |
| `qna/` | Questions + answers |
| `project/` | Project CRUD |
| `search/` | Global GIN index search |
| `storage/` | MinIO upload/download/delete |
| `gif/` | GIPHY API integration (GIF picker) |
| `anon/` | Scaffold only (README) |

| Frontend feature | Route(s) | Auth |
|---|---|---|
| `auth/` | `/login`, `/register` | Public |
| `feed/` | `/feed` | Public (default redirect) |
| `post/` | `/posts/new`, `/posts/:id`, `/posts/:id/edit` | Mixed |
| `profile/` | `/profile`, `/profile/:username` | Mixed |
| `communities/` | `/communities`, `/communities/new`, `/communities/:id` | Mixed |
| `qna/` | `/questions`, `/questions/new`, `/questions/:id` | Mixed |
| `dm/` | `/dm`, `/dm/:id` | Required |
| `settings/` | `/settings` | Required |
| `search/` | `/search` | Public |
| `notification/` | Bell dropdown in header | Required |

| Migration | Tables |
|---|---|
| V1–V6 | users, pgcrypto, anonymous_identities, user_profiles, communities |
| V7–V9 | posts (post_type enum), post_anonymous_map, VARCHAR→enum cast |
| V10–V13 | comments, follows, notifications, notification_type cast |
| V14–V18 | DMs, blocks, reports, projects, search indexes |
| V19–V22 | comment_votes, actor_username on notifications, post_votes, media_urls |
| V23–V24 | parent_id on comments, actor_id replaces actor_username |
| V25–V27 | website/location on profiles, post_saves, user_settings |
| V28–V31 | community_rules/requests/invite_links, cover_url, community_bans, invite_notification_type |
| V32–V36 | moderation_log, scheduled_posts/pinning, totp_to_users, mutes_table, accent_color |
| V37 | dm_conversations.id → UUID, V36 DM tables |
| V38–V40 | STOMP auth schema, conversation read receipts |
| V41–V42 | read_at improvements, trigger function |
| V43–V45 | DM UI helpers, search indexes, misc fixes |
| V46 | add_is_deleted_to_messages, create_questions_fts_index |
| V47 | create_qna_votes |
| V48 | add_anonymous_browsing_to_settings |
| V49 | add_email_verification |

---

## What NOT to Do

- No `@CrossOrigin` on controllers (CORS is central in `CorsConfig.java`)
- No stack traces in API responses (`GlobalExceptionHandler` catches all)
- No hardcoded secrets in `application.yml` — all values from env vars
- No `ddl-auto: create` or `update` (Flyway `validate` only)
- No `post_anonymous_map` joins in public feed queries
- No Angular Material (plain CSS only)
- No duplicate endpoints (debug routes removed)
- No `@PreAuthorize` or `@EnableMethodSecurity`
- No Angular `Date` pipe for timestamps — use `timeAgo()` from `core/time-ago.ts`
- No hardcoded width/height/spacing/color values in CSS — always use `var(--*)` CSS variables
- No `@Lob`/`TEXT` for report `reason` — use `VARCHAR(1000)` + `@Size(max=1000)`
- No two-directional block visibility (one-directional feed filter)

---

## Anchored Summary

### Goal
Complete mobile-first responsive overhaul, shared vote/save logic, real-time DM delivery, read receipts, message deletion, unread badge, N+1 fixes, STOMP auth, Q&A module features (delete/edit answers, edit questions, Markdown rendering, search/filter, voting), and fix anonymous browsing persist gap.

### Constraints & Preferences
- No `@PreAuthorize`, no Lombok, no field injection, DTOs as Records
- Soft delete only for messages (is_deleted boolean)
- STOMP CONNECT sends JWT via Authorization header; StompAuthChannelInterceptor validates it
- /api/auth/token reads HttpOnly cookie server-side for STOMP JWT
- Use existing marked integration pattern (getter + `[innerHTML]`) for Markdown
- Reuse VoteRequest DTO (`direction` field) — not a new `value` field
- Reuse vote toggle pattern: same value → delete (retract), different → update, none → insert
- timeAgo as class property binding, not Angular pipe

### Done
- **Phase 1 — Undo/Delete Logic Fix**: callback-based ToastService.showUndo(). 4 components.
- **Phase 2 — Correctness Fixes**: DM nav, storage upload env var, sidebar routerLink, 404→/feed.
- **Phase 3 — Shell & Navigation**: BottomNavComponent, responsive header/sidebar.
- **Phase 4 — Feed + Post Detail + Community + Profile + DM + Q&A Mobile CSS**: ≤768px media queries.
- **Phase 5 — Profile & DM & Q&A Overhaul**: Cover/avatar overlap, full-screen DM, sticky chat input.
- **Phase 6 — Shared Vote/Save Logic**: post-interaction.util.ts with optimisticToggleVote/save. 5 components.
- **AuthService Caching Fix**: 30s TTL cache, cleared on logout/401/login/register/verifyLogin.
- **Bug 1 (ProfileViewComponent)**: Already correct — no change.
- **Bug 2 (STOMP Auth)**: StompAuthChannelInterceptor + WebSocketConfig registration.
- **Real-time DM**: /api/auth/token endpoint, WebSocketService.subscribeToConversation() returns Observable, DmChatComponent subscription + dedupe + autoscroll.
- **Settings Audit**: Complete audit at frontend/audit/SETTINGS_AUDIT_REPORT.md — 3 issues documented.
- **N+1 Fix (DM)**: getConversations() 81→4 queries. Batch participants, profiles, last messages via DISTINCT ON.
- **Read Receipts**: Bulk UPDATE messages SET read_at=NOW(). Frontend ✓✓ indicator.
- **Message Deletion**: V46 migration. DELETE endpoint sets is_deleted=true (sender only). [deleted] placeholder.
- **Unread Badge**: ConversationResponse.unreadCount. Batch GROUP BY query. DmListComponent red badge.
- **Q&A Phase 1 — Delete/Edit Answers**: confirm dialog, inline textarea, single edit mode.
- **Q&A Phase 2 — Edit Question**: UpdateQuestionRequest, QnaService.updateQuestion(), inline view/edit toggle.
- **Q&A Phase 3 — Markdown + Editor + timeAgo**: marked.parse() in question/answer bodies, MarkdownEditorComponent in AskQuestion, timeAgo everywhere.
- **Q&A Phase 4 — Search & Filter**: V46 GIN index, native full-text + unanswered queries, 300ms debounce search input, Newest/Unanswered filter tabs.
- **Q&A Phase 5 — Voting**: V47 qna_votes table, toggle/retract logic, batch vote loading (2 queries), self-vote 403, read-only count in list.
- **Fix 1 — Anonymous Browsing persist**: V48 migration, UserSettings.anonymousBrowsing, DTO field, settings toggle wired to PUT /api/settings with optimistic update + revert on error.
- **Fix 2 — Account section (username/email)**: Backend UpdateUsernameRequest/UpdateEmailRequest DTOs, changeUsername()/changeEmail() in AuthService with current-password reauth + uniqueness checks, PUT /api/auth/username and PUT /api/auth/email endpoints. Frontend "Account" nav tab with forms following changePassword() pattern (validation, error display, success toast). Email applied immediately without verification (noted in code comment).
- **OCI Production Deployment**: backend/Dockerfile, frontend/Dockerfile, frontend/nginx.conf, docker-compose.prod.yml, application-prod.yml, scripts/deploy-oci.sh, scripts/nginx-ssl.conf, scripts/db-backup.sh, .github/workflows/deploy.yml, COOKIE_SECURE env var support in AuthController, CORS_ALLOWED_ORIGIN env var in CorsConfig.
- **Email Verification**: V49 migration adds `email`/`email_verified` columns + `email_verification_tokens` table. `EmailService` sends async verification/password-reset emails via SMTP (SendGrid-compatible). `AuthService.verifyEmail()` handles VERIFY_EMAIL + CHANGE_EMAIL tokens. `changeEmail()` creates verification token instead of immediate update. `forgotPassword()`/`resetPassword()` flow with 1hr expiry. Frontend `/verify-email`, `/forgot-password`, `/reset-password` pages. `spring.mail` env vars in docker-compose.prod.yml.

### In Progress
(none)

### Blocked
(none)

### Known Issues
- Hardcoded light colors in theme (Settings Audit #1)
- No debouncing on toggle (Settings Audit #2)
- No dedicated Account deletion section (Settings Audit #3)
- `no-elser` lint rule preferred — use early returns
