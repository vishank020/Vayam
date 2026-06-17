# Vayam — PROGRESS.md

> Last updated: 2026-06-16

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.2.5 + Java 21 + Maven |
| Frontend | Angular 18 (standalone, strict TS) |
| Database | PostgreSQL 16 (Docker, port 5434) |
| Storage | MinIO (S3-compatible, Docker, port 9000) |
| Auth | JWT (access + refresh) in HttpOnly cookies |
| Migrations | Flyway (never `ddl-auto`) |

---

## Build Order (9 Phases Complete)

| Phase | Features | Status |
|-------|----------|--------|
| 1 | Auth, Users, Profiles, DB schema, Storage | 100% |
| 2 | Communities (CRUD, roles, invites) | 100% |
| 3 | Posts + Q&A + Anonymous model | 100% |
| 4 | Social (follow, comments, notifications, blocks, reports) | 100% |
| 5 | Encrypted DMs | 100% |
| 6 | Project portfolio | 100% |
| 7 | Search (GIN full-text indexes) | 100% |
| 8 | Profile & Settings Experience (Avatar Cropper, Saved/Upvoted Posts, User Settings) | 100% |
| 9 | Responsive Design (all pages mobile/tablet/desktop/ultrawide) | 100% |

---

## What's Done

### Database — 27 Flyway Migrations (V1–V27, no gaps)

| Migration | Tables |
|-----------|--------|
| V1 | `users`, pgcrypto, `update_updated_at_column()` function |
| V2 | `anonymous_identities` — no FK to users, fully detached |
| V3 | `user_profiles` — FK to users, separates auth from display data |
| V4 | `communities`, `community_members`, `community_invites` |
| V5 | `questions`, `answers` |
| V6 | Drops profile columns from `users` (moved to `user_profiles`) |
| V7 | `posts` (`post_type` enum, FKs, trigger) |
| V8 | `post_anonymous_map` (FK to posts, NEVER join in public queries) |
| V9 | VARCHAR→`post_type` implicit cast (Hibernate/PostgreSQL enum compat) |
| V10 | `comments` (FK to posts/users, timestamps) |
| V11 | `follows` (UNIQUE constraint, no self-follow) |
| V12 | `notifications` (`notification_type` enum, reference_id, is_read) |
| V13 | VARCHAR→`notification_type` implicit cast (same pattern as V9) |
| V14 | `conversations`, `conversation_participants`, `messages` |
| V15 | `blocks` (UNIQUE, CHECK no self-block, indexes) |
| V16 | `reports` (reported_user_id, VARCHAR(1000) reason, index) |
| V17 | `projects` (user_id, title, description, tech_stack, URLs, dates) |
| V18 | GIN indexes on posts, communities, users, profiles (full-text search) |
| V19 | `comment_votes` (upvote/downvote FK to comments/users) |
| V20 | `actor_username` column on `notifications` |
| V21 | `post_votes` (like/dislike FK to posts/users) |
| V22 | `media_urls` TEXT[] column on `posts` |
| V23 | `parent_id` on `comments` (nested replies) |
| V24 | `actor_id` replaces `actor_username` on notifications (UUID FK to users) |
| V25 | `website` and `location` on `user_profiles` |
| V26 | `post_saves` (user_id, post_id junction) |
| V27 | `user_settings` (theme, notifications, privacy toggles) |

### Backend — All Modules

| Module | Endpoints | Auth |
|--------|-----------|------|
| Auth | `POST /register`, `POST /login`, `POST /refresh`, `GET /me`, `POST /logout` | public |
| User | `GET /me`, `PUT /me`, `PUT /me/public-key`, `GET /{id}`, `GET /by-username/{username}`, `GET /{id}/public-key` | mixed |
| Settings | `GET /api/settings`, `PUT /api/settings` | authenticated |
| Community | `POST/GET/PUT/DELETE`, `POST /{id}/join`, `POST /{id}/leave`, `POST /{id}/invite`, `GET/PUT invites`, `GET members`, `GET /my`, `GET /invites`, member management | mixed |
| Post | `POST/GET/PUT/DELETE`, `GET /communities/{id}/posts`, `GET /user/{userId}`, `GET /saved`, `GET /upvoted`, scheduled publishing | mixed |
| Comment | `POST/GET/DELETE /api/posts/{postId}/comments`, nested replies | mixed |
| Follow | `POST/DELETE /{userId}/follow`, `GET /{userId}/followers`, `GET /{userId}/following`, `GET /{userId}/follow-counts`, `GET /{userId}/is-following` | mixed |
| Block | `POST/DELETE /{userId}/block`, `GET /me/blocked` | authenticated |
| Report | `POST /{id}/report` | authenticated |
| Notification | `GET /`, `GET /unread-count`, `PUT /{id}/read`, `PUT /read-all` | authenticated |
| Q&A | Question CRUD, Answer CRUD, accept answer | mixed |
| Storage | `POST /upload`, `GET /url/{objectName}`, `DELETE /{objectName}` | authenticated |
| DM | `POST/GET /conversations`, `GET/POST /conversations/{id}/messages` | authenticated |
| Project | `POST/GET/PUT/DELETE /users/me/projects`, `GET /users/{userId}/projects` | mixed |
| Search | `GET /search` (posts, users, communities with GIN indexes) | public |
| GIF | GIPHY API integration (GIF picker, degrades gracefully with empty key) | authenticated |

### Frontend — All Components

| Module | Route(s) | Auth | Details |
|--------|----------|------|---------|
| Login | `/login` | Public | Username + password |
| Register | `/register` | Public | Username + email + password + display name + terms |
| Feed | `/feed` | Public | Paginated global feed, relative timestamps, edited badge, post type badges |
| Post Detail | `/posts/:id` | Public | Full post + embedded comments, edit/delete (author only) |
| Create Post | `/posts/new` | Required | Title, content, post type, community selector, anonymous toggle |
| Edit Post | `/posts/:id/edit` | Required | Pre-filled form, anonymous toggle |
| Profile | `/profile` | Required | View/edit bio, avatar, tabs for Posts/Comments/Saved/Upvoted |
| Profile View | `/profile/:username` | Public | Public profile with follow/block/report, public posts |
| Settings | `/settings` | Required | Tabs for Appearance, Notifications, Privacy & Safety |
| Communities | `/communities`, `/communities/new`, `/communities/:id` | Mixed | List, detail, create, join/leave, invite management |
| Q&A | `/questions`, `/questions/new`, `/questions/:id` | Mixed | Ask, list, detail, accept answer |
| Notification | (dropdown in header) | Required | Bell icon + dropdown + real-time via WebSocket |
| DM | `/dm`, `/dm/:id` | Required | Conversation list + real-time chat |
| Project | (in profile) | Mixed | Project showcase and portfolio management |
| Search | `/search` | Public | Global search with type filter (posts/communities/users) |
| Anonymous | (scaffold only) | Public | No dedicated UI yet |

### Responsive Design — All Pages (Phase 9)

| Page | Mobile (≤767px) | Tablet (768–1023px) | Desktop (1024px+) | Ultrawide (1440/1920+) |
|------|----------------|---------------------|-------------------|----------------------|
| Feed | Stacked layout, 250px media, compact action bar | — | Standard | Cap at 900/1000px |
| Post Detail | Title 1.75rem, iframe height reduced | Title scales | Standard | Same |
| Profile | Vertical header, 100px avatar, scrollable tabs | — | Side-by-side | Same |
| Profile View | Same as Profile | — | Same | Same |
| Settings | Sidebar→stacked, horizontal nav tabs | Reduced gaps | Sidebar layout | Same |
| Communities | Header wrap, 120px banner | — | Standard | Same |
| Community Detail | Vertical header, scrollable tabs | — | Standard | Same |
| Comments | 0.75rem indent, 28px avatars | — | Standard | Same |
| Auth Forms | Reduced padding | — | Centered card | Same |
| Notification Bell | `width: min(340px, 100vw-1rem)` | — | 340px dropdown | Same |
| DM | Stacked input, 85% message width | — | 75% message max | Same |
| Search | Full-width input, wraps | — | Standard | Same |
| Q&A Detail | Wrapping meta, 1.2rem title | — | Standard | Same |
| Q&A List | Vertical cards, row stats | — | Horizontal cards | Same |
| Markdown Editor | 36px toolbar buttons | — | 30px buttons | Same |

### Key Features

- **HttpOnly cookie auth**: Frontend never touches JWT tokens. All auth via `withCredentials: true`.
- **Relative timestamps**: `timeAgo()` utility — "2m ago", "5h ago", "1w ago", "2mo ago"
- **Edited post indicator**: Yellow **Edited** badge + "Edited 2h ago" when `updatedAt > createdAt + 1s`
- **Anonymous posts**: `is_anonymous=true` + `post_anonymous_map` row. NEVER joined in public queries.
- **Anonymous toggle on edit**: Creating/deleting `post_anonymous_map` row on toggle.
- **Comment isAuthor**: Per-request boolean for delete button visibility.
- **Real-time notifications**: STOMP over WebSocket (`/user/queue/notifications`), updates unread badge instantly.
- **PostgreSQL enums**: `post_type` and `notification_type` with implicit VARCHAR→enum cast for Hibernate compat.
- **UserResponse follow view**: `GET /api/users/by-username/{username}` returns `followerCount`, `followingCount`, and `isFollowing` (`null` when anonymous).
- **Idempotent block/unblock**: `BlockService.block()` / `unblock()` return silently on duplicate / no-op. One-directional feed filtering.
- **Report with validation**: `POST /api/users/{id}/report` accepts `@Size(max=1000)` reason, stores with `reported_user_id`.
- **Unified Action Bar**: Like (glowing thumbs-up), Dislike (glowing thumbs-down), Comment, Save, Share across Feed, Post Detail, and Profiles.
- **Q&A System**: Anyone can post the first answer to a question. Author can accept answers.
- **Scheduled posts**: `@Scheduled(fixedRate = 60000)` publishes `SCHEDULED` posts. Excluded from feed queries.
- **Pinned posts**: Sort first in community feeds.
- **Responsive design system**: CSS variables (`--*` tokens) for layout, spacing, font scale, safe area. No hardcoded values.
- **Navigation drawer**: `SidebarService` with RxJS Subject. `translateX(-100%)` overlay + backdrop on mobile. Closes on route change.
- **Touch-optimized**: 44px min tap targets via `@media (pointer: coarse)`. Safe area support for notched devices.
- **String[] → TEXT[] mapping**: `Post.mediaUrls` uses `@Type(StringArrayType.class)` via `hypersistence-utils-hibernate-63`.

### Verified Working

- Auth flow: register → login → cookies set → `/me` returns user → logout → cookies cleared
- Communities: create (public/private), list, detail, join, leave, invite, accept/decline
- Posts: create (normal + anonymous), feed (global + community), detail, edit with anonymous toggle, delete
- Comments: create, list (paginated, public), nested replies, delete (author/post-author only)
- Follow: follow, unfollow, followers/following lists, counts, is-following check
- Block: block (200), idempotent re-block (200), unblock (200), blocked user cannot follow blocker (400)
- Report: POST report (200), row in `reports` table
- Profile view: `/profile/:username` loads public profile, follow/block/report buttons for authenticated users
- Settings: GET/PUT user preferences (theme, notifications, privacy)
- Notifications: bell dropdown, real-time STOMP push, mark read
- Q&A: ask, answer, accept
- DM: conversation list, real-time messaging
- Search: global search with type filter
- Frontend: `ng build` passes (no errors, CSS budget warnings are non-blocking)
- Backend: `mvnw package -DskipTests` passes (no errors)
- Responsive: All pages tested at 320/375/768/1024/1440/1920px viewports
- Touch: Pointer-coarse detection works (44px targets, no overlapping taps)
- Media: Images/video/iframe capped at 100% width, no horizontal overflow

---

## Known Gaps

| Gap | Details |
|-----|---------|
| `users` table has legacy profile columns | V3 creates `user_profiles` but doesn't drop columns from `users` — both coexist |
| Docker PostgreSQL on 5434 | Native PostgreSQL 18 on 5432 causes conflict |
| Anonymous post frontend | `anonymous/` module is empty — no dedicated anonymous UI |
| No test files | Zero `.spec.ts` or `*Test.java` files. Pipeline runs `skipTests: true` |
| CSS budget warnings | Component CSS exceeds Angular budgets (2.05kB) for profile, community-detail, feed, post-detail, comment components. Pre-existing, non-blocking |

---

## Key Decisions

1. **PostgreSQL on 5434** — avoids conflict with native PostgreSQL 18 on 5432
2. **MinIO over local FS** — S3-compatible, code is 1:1 portable to AWS S3
3. **Cookie auth** — JWT in HttpOnly cookies, never in JS/localStorage
4. **`withCredentials: true`** — frontend uses this instead of manually attaching Bearer tokens
5. **No `@CrossOrigin`** — CORS lives exclusively in `CorsConfig.java`
6. **PostgreSQL enum with implicit cast** — `post_type` and `notification_type` enums; V9/V13 add VARCHAR→enum cast for Hibernate compat
7. **`post_anonymous_map` NEVER joined in public queries** — only accessible via moderation/internal service
8. **No `@PreAuthorize` or `@EnableMethodSecurity`** — all auth in `SecurityConfig.authorizeHttpRequests`
9. **Native WebSocket STOMP** — `@stomp/stompjs` over `ws://` (no SockJS fallback)
10. **Plain CSS** — no Angular Material or Tailwind
11. **Boxed types for nullable follow fields** — `Long`/`Boolean` in `UserResponse` so `isFollowing` can be `null` for unauthenticated viewers
12. **One-directional block** — blocker hides blocked user's posts from feed; blocked user simply can't follow back
13. **`hypersistence-utils-hibernate-63` over JSONB** — column already `TEXT[]` so array type mapping avoids migration. No data loss for existing rows.
14. **`SidebarService` over `@Output`/`@Input`** for sidebar state — siblings (header + sidebar) need shared state without prop drilling. Simple RxJS `Subject` in root-provided service.
15. **CSS variables over PostCSS/Sass** — no build tool change needed. `:root` media queries update variable values responsively — consumed by all components.
16. **`pointer: coarse` for touch targets** instead of viewport-width media query — detects actual input method, not just screen size. Works on tablets and foldables.
17. **240px sidebar drawer on mobile** — matches standard mobile nav drawer width. Transform-based slide with `0.25s ease` transition.
