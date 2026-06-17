# Development Plan — Vayam

A community platform for college students and developers to connect, create communities, showcase projects, post achievements/job openings, send encrypted DMs, and optionally remain anonymous.

---

## Tech Stack

| Category | Choice |
|----------|--------|
| Backend | Spring Boot 3.2.5, Java 17 source / 21 runtime, Maven |
| Frontend | Angular 18 (standalone, strict TS), plain CSS |
| Database | PostgreSQL 16 + Flyway + pgcrypto |
| Auth | JWT (15m access + 7d refresh) in HttpOnly cookies, BCrypt |
| Realtime | STOMP over WebSocket |
| E2EE | Planned (Web Crypto API: RSA-OAEP + AES-GCM) |
| Storage | MinIO (S3-compatible, Docker) |

---

## Phases

### Phase 1: Foundation (✅ Complete)
**Auth + User Profiles + DB schema + Storage**

- Backend: Spring Boot project, JWT auth (register/login/refresh), user profile CRUD
- Frontend: Angular standalone scaffold, auth UI (login/register), profile page
- Database: Users table, Flyway migrations V1–V3, pgcrypto
- Storage: MinIO upload/download/delete/presigned URLs
- Docs: SETUP.md, AUTH.md, ARCHITECTURE.md, CONTRIBUTING.md

### Phase 2: Communities (✅ Complete)
**CRUD, roles (OWNER/MOD/MEMBER), public/private, invites**

- Communities backend: 12+ REST endpoints
- Communities frontend: list, detail, create, join/leave, invite management
- DB: V4 (communities + members + invites)

### Phase 3: Posts + Q&A (✅ Complete)
**Global feed, community feed, anonymous posting, Q&A**

- Post types: GENERAL, ACHIEVEMENT, PROJECT, JOB
- Anonymous: `post_anonymous_map` (NEVER joined in public queries)
- Edit with anonymous toggle, relative timestamps, edited badge
- Q&A: questions + answers, accept answer
- DB: V5 (questions + answers), V7–V9 (posts + anonymous map + enum cast)
- Frontend: feed page, post detail with comments, create/edit post

### Phase 4: Social (✅ Complete)
**Follow, Comments, Notifications, Block, Report**

- Follow: follow/unfollow, followers/following lists, counts
- Comments: paginated, nested replies, `isAuthor` reveal
- Notifications: types (FOLLOW, COMMENT, LIKE, MENTION), real-time via WebSocket
- Block: idempotent, one-directional feed filter
- Report: VARCHAR(1000) reason, stored with `reported_user_id`
- DB: V10 (comments), V11 (follows), V12–V13 (notifications + enum cast), V15 (blocks), V16 (reports), V19 (comment_votes), V21 (post_votes), V23 (parent_id)
- Frontend: comment list, notification bell, WebSocket service

### Phase 5: Encrypted DMs (✅ Complete)
**E2EE direct messaging via WebSocket**

- STOMP over WebSocket for real-time chat
- REST APIs for conversations and message history
- Frontend DM interface
- DB: V14 (conversations, participants, messages)

### Phase 6: Project Portfolio (✅ Complete)
**Per-user project showcase**

- `project/` backend with REST endpoints
- Frontend project showcase integration
- DB: V17 (projects)

### Phase 7: Search (✅ Complete)
**Global search across posts, communities, users**

- `search/` backend with GIN index full-text search
- DB: V18 (GIN indexes for full-text search)
- Frontend search page

### Phase 8: Profile & Settings Experience (✅ Complete)
**Avatar upload/crop, saved/upvoted post tabs, user settings**

- Avatar cropping UI (modal with canvas-based cropper)
- Saved posts tab (`GET /api/posts/saved`)
- Upvoted posts tab (`GET /api/posts/upvoted`)
- User settings page (appearance, notifications, privacy)
- DB: V22 (media_urls TEXT[]), V25 (website/location), V26 (post_saves), V27 (user_settings)
- Frontend: profile tabs, settings page, avatar cropper

### Phase 9: Responsive Design (✅ Complete)
**Full responsive layout across all viewports**

- Design token system: CSS variables for layout, spacing, font scale, safe area
- Mobile nav drawer: `SidebarService` with `translateX(-100%)` overlay + backdrop
- Touch optimization: 44px min tap targets via `@media (pointer: coarse)`
- Safe area support for notched devices
- All 16+ frontend pages responsive at 320/375/768/1024/1440/1920px
- Global `flex-wrap: wrap` on all flex headers/action bars
- `img, video, iframe, embed { max-width: 100% }` prevents media overflow
- Ultrawide cap at 1440px (900px container) and 1920px (1000px container)

---

## Module Map

| Module | Backend Package | Frontend Feature | Status |
|--------|----------------|-----------------|--------|
| Auth | `auth/` | `auth/` | ✅ Complete |
| User | `user/` | `profile/` | ✅ Complete |
| Community | `community/` | `communities/` | ✅ Complete |
| Post | `post/` | `feed/` + `post/` | ✅ Complete |
| Comment | `comment/` | `comment/` | ✅ Complete |
| Follow | `follow/` | (profile integration) | ✅ Complete |
| Notification | `notification/` | `notification/` | ✅ Complete |
| Q&A | `qna/` | `qna/` | ✅ Complete |
| DM | `dm/` | `dm/` | ✅ Complete |
| Project | `project/` | (profile integration) | ✅ Complete |
| Anonymous | `anon/` | `anonymous/` | ✅ Complete (backend) / Scaffold (frontend) |
| Search | `search/` | `search/` | ✅ Complete |
| Settings | — | `settings/` | ✅ Complete |
| Block | `block/` | (profile integration) | ✅ Complete |
| Report | `report/` | (profile integration) | ✅ Complete |
| Storage | `storage/` | — | ✅ Complete |
| GIF | `gif/` | (markdown editor) | ✅ Complete |

---

## Future Work

- **E2EE for DMs**: Implement Web Crypto API encryption layer
- **Anonymous frontend**: Dedicated anonymous post UI
- **Tests**: Add unit/integration tests for backend and frontend
- **CI/CD**: Add test stages to GitHub Actions pipeline
- **Notifications page**: Dedicated full-page notification history
- **Dark/Light theme toggle**: Already wired in settings, needs frontend implementation
- **2FA**: Backend TOTP implemented (V32), needs frontend UI in settings
- **Mute user**: Backend implemented (V35), needs frontend UI
- **Accent color picker**: Backend implemented (V36), needs frontend UI
