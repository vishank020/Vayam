# Vayam — Community Platform

A platform for college students and developers to connect, create communities, share projects, post anonymously, and message securely.

---

## Current State (Phase 9 Complete ✅)

9 build phases complete: Auth → Communities → Posts/Q&A → Social → DMs → Projects → Search → Settings/Profile Experience → Advanced Security & Personalization.

### Backend

| Component | Status | Details |
|-----------|--------|---------|
| Auth (register/login/refresh/logout) | ✅ Tested | JWT HttpOnly cookies, BCrypt, SHA-256 email hash |
| User profiles (CRUD) | ✅ Tested | Display name, bio, avatar, website, location, follow counts |
| Communities (CRUD, roles, invites) | ✅ Tested | OWNER/MOD/MEMBER roles, public/private, rules, bans, moderation log |
| Posts + Anonymous model | ✅ Tested | Global/community feed, `post_anonymous_map`, scheduled/pinned posts |
| Comments (nested replies) | ✅ Tested | Paginated, `isAuthor` reveal, anonymous support |
| Follow | ✅ Tested | Follow/unfollow, followers/following lists, counts |
| Block | ✅ Tested | Idempotent, one-directional feed filter |
| Report | ✅ Tested | VARCHAR(1000) reason, stored with `reported_user_id` |
| Notifications (STOMP) | ✅ Tested | READ/UNREAD/COMMENT/LIKE/MENTION types, real-time push |
| Q&A | ✅ Tested | Questions + answers, accept answer |
| DM (E2EE-ready) | ✅ Tested | Conversations, real-time messaging via STOMP |
| Projects | ✅ Tested | Per-user project portfolio |
| Search (GIN indexes) | ✅ Tested | Full-text across posts, communities, users |
| GIF picker | ✅ Wired | GIPHY API integration, graceful degradation |
| Storage (MinIO) | ✅ Tested | Upload, download, delete, presigned URLs |
| Flyway migrations | ✅ Applied | V1–V36 |
| PostgreSQL 16 (Docker) | ✅ Running | Port 5434 |
| WebSocket (STOMP) | ✅ Wired | `/ws` endpoint, real-time notifications + chat |

### Frontend

| Component | Route | Details |
|-----------|-------|---------|
| Login | `/login` | Username + password form |
| Register | `/register` | Username + email + password + display name + terms |
| Feed | `/feed` | Paginated, relative timestamps, edited badge, post types |
| Post Detail | `/posts/:id` | Full post + comments, edit/delete (author only) |
| Create Post | `/posts/new` | Title, content, type, community, anonymous, markdown editor |
| Edit Post | `/posts/:id/edit` | Pre-filled form, anonymous toggle |
| Profile | `/profile` | Edit bio/avatar, tabs for Posts/Comments/Saved/Upvoted |
| Profile View | `/profile/:username` | Public with follow/block/report |
| Settings | `/settings` | Appearance, Notifications, Privacy & Safety |
| Communities | `/communities/*` | List, detail, create, join/leave, invite management |
| Q&A | `/questions/*` | Ask, list, detail, accept answer |
| Notifications | — | Bell icon + dropdown + real-time WebSocket |
| DM | `/dm*` | Conversation list + real-time chat |
| Search | `/search` | Global search with type filter |
| Project | (in profile) | Portfolio showcase |

### Database — 36 Flyway Migrations (V1–V36)

| Migrations | Tables |
|------------|--------|
| V1–V6 | users, pgcrypto, anonymous_identities, user_profiles, communities |
| V7–V9 | posts (post_type enum), post_anonymous_map, VARCHAR→enum cast |
| V10–V13 | comments, follows, notifications, notification_type cast |
| V14–V18 | DMs, blocks, reports, projects, search indexes |
| V19–V22 | comment_votes, post_votes, media_urls, actor_username |
| V23–V24 | parent_id on comments, actor_id replaces actor_username |
| V25–V27 | website/location on profiles, post_saves, user_settings |
| V28–V36 | community_rules/requests/invite_links, cover_url, community_bans, moderation_log, scheduled/pinned posts, 2FA (TOTP), mutes, accent_color |

### Responsive Design

All pages fully responsive across mobile (320–767px), tablet (768–1023px), desktop (1024–1439px), and ultrawide (1440px+).

- **CSS variable design tokens**: Layout, spacing scale, font scale, safe area — no hardcoded values
- **Mobile nav drawer**: `translateX(-100%)` sidebar with backdrop, hamburger button in header
- **Touch optimization**: 44px min tap targets via `@media (pointer: coarse)`
- **Safe area**: notched device support via `env(safe-area-inset-*)`
- **`flex-wrap: wrap` everywhere**: All headers, meta lines, action bars wrap gracefully
- **Media overflow**: `img, video, iframe, embed { max-width: 100% }` globally

---

## Quick Start

### 1. Infrastructure
```bash
docker compose up -d
```

### 2. Backend (port 8080)
```bash
cd backend
$env:DB_USERNAME="community_user"; $env:DB_PASSWORD="community_pass"; $env:DB_URL="jdbc:postgresql://localhost:5434/community_db"; $env:JWT_SECRET="change-me-at-least-32-chars-long!"; $env:ENCRYPTION_SECRET="change-me-at-least-32-chars-long!"; $env:GIPHY_API_KEY=""; mvnw.cmd spring-boot:run
```

### 3. Frontend (port 4200)
```bash
cd frontend
ng serve
```

Open `http://localhost:4200`.

---

## Documentation

| Document | What It Covers |
|----------|---------------|
| [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) | 9-phase build roadmap |
| [PROGRESS.md](PROGRESS.md) | Detailed progress, known gaps, test results |
| [AGENTS.md](AGENTS.md) | AI assistant instructions, conventions, commands |
| [docs/SETUP.md](docs/SETUP.md) | Full local environment setup |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, module dependencies |
| [docs/DATABASE.md](docs/DATABASE.md) | ERD, schema docs, migration details |
| [docs/API.md](docs/API.md) | All REST + WebSocket endpoints |
| [docs/AUTH.md](docs/AUTH.md) | JWT cookie flow, register/login/refresh |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | PR process, code style |

---

## Known Issues

- **Port conflict**: Native PostgreSQL 18 on port 5432 → Docker PostgreSQL on 5434
- **Profile columns**: V3 creates `user_profiles` but `users` table still has legacy profile columns (not dropped)
- **No tests**: Zero `.spec.ts` or `*Test.java` files. Pipeline runs `skipTests: true`
- **CSS budget warnings**: Component CSS exceeds Angular budgets (~2.05kB) for several large components. Pre-existing, non-blocking
