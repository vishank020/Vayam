# Vayam — Complete Project Feature Audit

## Part 1 — Executive Summary

**Project Purpose**: A community platform (Reddit/Discourse-style) for college students and developers to connect, create communities, share projects, post anonymously, and message securely.

**Current Development Stage**: Phase 9 of 9 complete. All planned build phases are finished. Project is in a feature-complete state with no active development phase.

**Major Modules** (21 total):
- Auth (JWT cookie-based), User Profiles, Communities, Posts, Comments, Notifications (STOMP), Follow, Block, Report, Mute, DM (STOMP chat), Q&A, Projects, Search (GIN), Settings, Storage (MinIO), GIF picker, Anonymous browsing, Legal pages, 2FA (TOTP), Accent color

**Overall Feature Completeness**: **~85%**

The backend is materially complete (~95%) — nearly all endpoints exist and work. The frontend is partially complete (~80%) — all routes render but several features use simulated/placeholder UI (Save Post, Follow Post, Post Report, Pin/Insights/Collections) instead of calling real APIs. Several backend features lack frontend UIs (2FA setup, mute user, accent color picker).

---

## Part 2 — Feature Inventory

### Authentication

| Feature | Status | Evidence |
|---------|--------|----------|
| Registration | ✅ Complete | `AuthController.register()` + frontend `/register` route |
| Login | ✅ Complete | `POST /api/auth/login`, JWT cookies set |
| JWT Authentication | ✅ Complete | `JwtAuthenticationFilter` reads cookie + Bearer header |
| Logout | ✅ Complete | Cookies cleared via `Max-Age=0` |
| Password Change | ✅ Complete | `PUT /api/auth/password` |
| Password Reset | ❌ Missing | No "forgot password" flow, no reset token endpoint |
| Email Verification | ❌ Missing | Email is SHA-256 hashed and stored, never verified |
| Role System | ⚠️ Partial | `users.role` column exists but only `USER` value is used. No admin panel, no permission checks |
| Anonymous Browsing | ✅ Complete | `AnonymousController` + `AnonymousService` creates anonymous sessions with random display names |

### User Profiles

| Feature | Status | Evidence |
|---------|--------|----------|
| Profile Page | ✅ Complete | `/profile` with edit capabilities |
| Other User Profile | ✅ Complete | `/profile/:username` with follow/block/report buttons |
| Avatar Upload | ✅ Complete | Uses MinIO storage upload + profile update |
| Avatar Cropping | ✅ Complete | Canvas-based cropper in profile component |
| Profile Editing | ✅ Complete | `PUT /api/users/me` updates displayName, bio, avatarUrl, coverUrl, website, location |
| Bio | ✅ Complete | `@Size(max=200)` in `UpdateProfileRequest` |
| Website | ✅ Complete | V25 migration added `website` column |
| Location | ✅ Complete | V25 migration added `location` column |
| Followers | ✅ Complete | `GET /api/users/{userId}/followers` |
| Following | ✅ Complete | `GET /api/users/{userId}/following` |
| User Search | ✅ Complete | `GET /api/users/search?q=` (limited to 5 results) |

### Settings

| Feature | Status | Evidence |
|---------|--------|----------|
| Account Settings | ⚠️ Partial | Settings page renders but has no UI for password change |
| Appearance | ⚠️ Partial | Theme toggle (dark/light) settings stored, but no frontend toggle for accent color |
| Theme Switching | ✅ Complete | `localStorage.getItem('cc-theme')` + `document.body.classList` |
| Notifications | ✅ Complete | Settings page has notification toggles (comments, replies, mentions, follows, system) |
| Privacy | ✅ Complete | Show email/website/location toggles, allow discovery, allow follow requests |
| Security | ⚠️ Partial | Backend has 2FA (TOTP) in V32/V34 but **no frontend UI** to enable/disable it |
| About Page | ❌ Missing | No "About" page or app version display |

**Critical Bug**: `UserSettingsController` uses `@AuthenticationPrincipal UUID userId` but the auth principal is `AuthPrincipal` (not a UUID). This assignment **will always fail**, meaning `GET /api/settings` and `PUT /api/settings` are effectively broken. (Frontend code calls these endpoints but would receive a 500 or mismatch error.)

### Posts

| Feature | Status | Evidence |
|---------|--------|----------|
| Create Post | ✅ Complete | `POST /api/posts` + `CreatePostComponent` with markdown editor |
| Edit Post | ✅ Complete | `PUT /api/posts/{id}` + `EditPostComponent` |
| Delete Post | ✅ Complete | `DELETE /api/posts/{id}` |
| Markdown | ✅ Complete | `marked@14.1.4` library, `MarkdownEditorComponent` with Write/Preview tabs |
| Media Uploads | ✅ Complete | MinIO upload + `media_urls` TEXT[] array on posts |
| Image Support | ✅ Complete | `max-width: 100%` + `max-height: 250px` on mobile feed |
| Video Support | ✅ Complete | MinIO accepts mp4/webm |
| YouTube Embeds | ✅ Complete | Iframe rendering in post detail with mobile responsive height |
| Feed Cards | ✅ Complete | `FeedPageComponent` with relative timestamps, edited badge, post type badges |
| Post Detail View | ✅ Complete | `PostDetailComponent` with full post + comments |
| Save Post | ⚠️ Partial | Backend complete (`POST/DELETE /api/posts/{id}/save`, `GET /api/posts/saved`). Frontend has simulated save in `post-actions-menu` (`console.warn` + `alert`) |
| Follow Post | ❌ Missing | Frontend placeholder only: `console.warn("Follow Post: Backend endpoint missing. UI placeholder activated.")` |
| Report Post | ⚠️ Partial | Backend: report endpoints exist for **users** only (`POST /api/users/{id}/report`). No backend endpoint for reporting posts. Frontend: simulated report in `post-actions-menu` (`alert('Post reported successfully. (Simulated)')`) |
| Share | ✅ Complete | `copyLink()` copies post URL to clipboard |
| Like System | ✅ Complete | `PostVoteController` with upvote/downvote, unified action bar |

### Comments

| Feature | Status | Evidence |
|---------|--------|----------|
| Comment Creation | ✅ Complete | `POST /api/posts/{postId}/comments` |
| Replies (nested) | ✅ Complete | V23 migration added `parent_id`, `CommentService` handles parentId |
| Reply Depth Rules | ❌ Missing | No depth limit — infinite nesting possible |
| Mentions | ✅ Complete | `CommentService` parses `@mentions` via regex and creates MENTION notifications |
| Mention Notifications | ✅ Complete | Notification created for mentioned users |
| GIF Support | ✅ Complete | `GifPickerComponent` integrated with `MarkdownEditorComponent`, backed by `GifService` → GIPHY API |
| Markdown Rendering | ✅ Complete | `marked@14.1.4` renders comment content |
| Comment Moderation | ❌ Missing | No delete-by-mod capability, only author can delete |

### Communities

| Feature | Status | Evidence |
|---------|--------|----------|
| Community Creation | ✅ Complete | `POST /api/communities` |
| Community Settings | ✅ Complete | `PUT /api/communities/{id}` |
| Membership | ✅ Complete | Join/leave/member list |
| Community Rules | ✅ Complete | CRUD via community detail page |
| Invite Links | ✅ Complete | `CommunityInviteLink` entity + `/communities/join/:code` route |
| Join Requests | ✅ Complete | Private community join requests with approve/reject |
| Moderation | ✅ Complete | `ModerationLog` entity, member removal, role changes |
| Roles | ✅ Complete | OWNER/ADMIN/MOD/MEMBER with hierarchy enforcement |
| Owner/Admin/Moderator | ✅ Complete | Role-based permission checks in `CommunityService` |
| Bans | ✅ Complete | `CommunityBan` entity, ban/unban, duration/expiry |
| Mod Logs | ✅ Complete | `ModerationLog` tracks all moderation actions |

### Notifications

| Feature | Status | Evidence |
|---------|--------|----------|
| Mentions | ✅ Complete | CREATED notification via `CommentService` regex |
| Replies | ⚠️ Partial | Only notifies **post author**, not the parent comment author |
| Post Activity | ✅ Complete | COMMENT notification when someone comments on your post |
| Community Invites | ✅ Complete | INVITE notification type (V31) |
| Role Changes | ❌ Missing | No notification when role is changed |
| Moderation Actions | ❌ Missing | No notification when banned/unbanned/removed |

### Search

| Feature | Status | Evidence |
|---------|--------|----------|
| Post Search | ✅ Complete | GIN full-text search on posts (title + content) |
| User Search | ✅ Complete | GIN search on users (username) + user_profiles (display_name + bio) |
| Community Search | ✅ Complete | GIN search on communities (name + description) |
| Filtering | ⚠️ Partial | Type filter (all/posts/communities/users) works in frontend but backend always returns all types, client-side filtering |
| Sorting | ❌ Missing | No sort parameter — always by relevance (ts_rank) |

### Legal & Compliance

| Feature | Status | Evidence |
|---------|--------|----------|
| Privacy Policy | ✅ Complete | `/privacy-policy` route |
| Terms & Conditions | ✅ Complete | `/terms-and-conditions` route |
| Registration Consent | ✅ Complete | `acceptedTerms` field validated `@NotNull @AssertTrue` |
| Consent Validation | ✅ Complete | `RegisterRequest` requires acceptedTerms=true |

Notable: Terms and Privacy pages are hardcoded HTML rather than dynamically loaded from a CMS or Markdown.

### Media

| Feature | Status | Evidence |
|---------|--------|----------|
| Storage Uploads | ✅ Complete | `POST /api/storage/upload` to MinIO |
| MinIO | ✅ Complete | Docker container, `MinioStorageService`, `MinioConfig` |
| Image Validation | ✅ Complete | Content-type whitelist: jpeg, png, gif, webp |
| Video Validation | ✅ Complete | Content-type whitelist: mp4, webm |
| Avatar Storage | ✅ Complete | Uploaded via storage endpoint, stored on MinIO |
| Post Media | ✅ Complete | `media_urls` TEXT[] array, `@Type(StringArrayType.class)` |

### Responsive Design

| Feature | Status | Evidence |
|---------|--------|----------|
| Mobile | ✅ Complete | All 16+ pages responsive at 320px–767px |
| Tablet | ✅ Complete | Breakpoints at 768px–1023px |
| Desktop | ✅ Complete | 1024px+ standard layout |
| Ultrawide | ✅ Complete | 1440px+ (900px container), 1920px+ (1000px container) |

### AI Features

| Feature | Status | Evidence |
|---------|--------|----------|
| Implemented AI Features | ❌ None | No AI features exist |
| Placeholder AI Features | ❌ None | No AI stubs found |
| Planned AI Features | ❌ None | No AI features in any planning document |

---

## Part 3 — Routes Audit

| Route | Auth | Purpose | Component |
|-------|------|---------|-----------|
| `/login` | Public | Username + password login form | `LoginComponent` |
| `/register` | Public | Registration with username, email, password, display name, terms | `RegisterComponent` |
| `/privacy-policy` | Public | Privacy policy page | `PrivacyPolicyComponent` |
| `/terms-and-conditions` | Public | Terms of service page | `TermsAndConditionsComponent` |
| `/feed` | Public (default) | Paginated global post feed | `FeedPageComponent` |
| `/posts/new` | Required | Create post with markdown editor | `CreatePostComponent` |
| `/posts/:id` | Public | Post detail with comments | `PostDetailComponent` |
| `/posts/:id/edit` | Required | Edit post with pre-filled form | `EditPostComponent` |
| `/profile` | Required | Own profile with edit + tabs (Posts/Comments/Saved/Upvoted) | `ProfileComponent` |
| `/profile/:username` | Public | Public profile with follow/block/report | `ProfileViewComponent` |
| `/settings` | Required | Appearance, Notifications, Privacy tabs | `SettingsPageComponent` |
| `/communities` | Public | Community list | `CommunityListComponent` |
| `/communities/new` | Required | Create community form | `CreateCommunityComponent` |
| `/communities/:id` | Public | Community detail with tabs | `CommunityDetailComponent` |
| `/communities/join/:code` | Public | Join via invite link | `CommunityDetailComponent` |
| `/questions` | Public | Q&A question list | `QuestionListComponent` |
| `/questions/new` | Required | Ask a question | `AskQuestionComponent` |
| `/questions/:id` | Public | Question detail with answers | `QuestionDetailComponent` |
| `/search` | Public | Global search with type filter | `SearchPageComponent` |
| `/dm` | Required | Direct message conversation list | `DmListComponent` |
| `/dm/:id` | Required | Direct message chat | `DmChatComponent` |
| `/` | — | Redirects to `/feed` | — |
| `/**` | — | Catch-all redirects to `/login` | — |

---

## Part 4 — Backend API Audit

### Auth (`/api/auth`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/register` | Create account + set cookies | Public |
| POST | `/login` | Authenticate + set cookies | Public |
| POST | `/login/verify` | 2FA code verification | Public |
| GET | `/2fa/generate` | Generate TOTP secret + QR code | Authenticated |
| POST | `/2fa/enable` | Enable TOTP 2FA | Authenticated |
| POST | `/2fa/disable` | Disable TOTP 2FA | Authenticated |
| POST | `/refresh` | Refresh access token | Public |
| GET | `/me` | Get current user or 401 | Public |
| PUT | `/password` | Change password | Authenticated |
| POST | `/logout` | Clear auth cookies | Public |

### Users (`/api/users`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/me` | Get own profile | Authenticated |
| PUT | `/me` | Update profile | Authenticated |
| DELETE | `/me/avatar` | Remove avatar | Authenticated |
| PUT | `/me/public-key` | Update E2EE public key | Authenticated |
| GET | `/check-auth` | Debug auth check | Public |
| GET | `/{id}` | Get user by ID | Public |
| GET | `/by-username/{username}` | Get user by username | Public |
| GET | `/{id}/public-key` | Get user's public key | Public |
| GET | `/search?q=` | Search users by username | Public |
| GET | `/{id}/comments` | Get user's comments | Public |
| POST | `/{userId}/follow` | Follow user | Authenticated |
| DELETE | `/{userId}/follow` | Unfollow user | Authenticated |
| GET | `/{userId}/followers` | Get followers list | Public |
| GET | `/{userId}/following` | Get following list | Public |
| GET | `/{userId}/follow-counts` | Get follow counts | Public |
| GET | `/{userId}/is-following` | Check if following | Public |
| POST | `/{userId}/block` | Block user | Authenticated |
| DELETE | `/{userId}/block` | Unblock user | Authenticated |
| GET | `/me/blocked` | List blocked user IDs | Authenticated |
| POST | `/{userId}/mute` | Mute user | Authenticated |
| DELETE | `/{userId}/mute` | Unmute user | Authenticated |
| POST | `/{id}/report` | Report user | Authenticated |

### Settings (`/api/settings`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/` | Get user settings | Authenticated |
| PUT | `/` | Update user settings | Authenticated |

**BUG**: `@AuthenticationPrincipal UUID userId` fails to resolve (AuthPrincipal is not UUID).

### Communities (`/api/communities`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/` | Create community | Authenticated |
| GET | `/` | List communities | Public |
| GET | `/my` | List my communities | Authenticated |
| GET | `/invites` | List my invites | Authenticated |
| GET | `/{id}` | Get community detail | Public |
| PUT | `/{id}` | Update community | Authenticated |
| DELETE | `/{id}` | Delete community | Authenticated |
| POST | `/{id}/join` | Join community | Authenticated |
| POST | `/{id}/leave` | Leave community | Authenticated |
| POST | `/{id}/invite` | Invite user | Authenticated |
| GET | `/{id}/invites` | List community invites | Authenticated |
| POST | `/{id}/invites/{inviteId}/accept` | Accept invite | Authenticated |
| POST | `/{id}/invites/{inviteId}/decline` | Decline invite | Authenticated |
| GET | `/{id}/members` | List members | Public |
| PUT | `/{id}/members/{memberId}/role` | Update member role | Authenticated |
| DELETE | `/{id}/members/{memberId}` | Remove member | Authenticated |
| POST | `/{id}/transfer-ownership/{newOwnerId}` | Transfer ownership | Authenticated |
| GET | `/{id}/bans` | List bans | Authenticated |
| POST | `/{id}/bans` | Ban member | Authenticated |
| DELETE | `/{id}/bans/{banId}` | Unban user | Authenticated |
| GET | `/{id}/rules` | List rules | Public |
| POST | `/{id}/rules` | Create rule | Authenticated |
| PUT | `/{id}/rules/{ruleId}` | Update rule | Authenticated |
| DELETE | `/{id}/rules/{ruleId}` | Delete rule | Authenticated |
| GET | `/{id}/join-requests` | List join requests | Authenticated |
| POST | `/{id}/join-requests/{requestId}/approve` | Approve join request | Authenticated |
| POST | `/{id}/join-requests/{requestId}/reject` | Reject join request | Authenticated |
| GET | `/{id}/invite-links` | List invite links | Authenticated |
| POST | `/{id}/invite-links` | Create invite link | Authenticated |
| DELETE | `/{id}/invite-links/{linkId}` | Delete invite link | Authenticated |
| POST | `/join/{code}` | Join via invite link code | Authenticated |
| GET | `/{id}/mod-log` | Get moderation log | Authenticated |
| GET | `/{id}/analytics` | Get analytics | Authenticated |

### Posts (`/api/posts`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/` | Create post | Authenticated |
| GET | `/` | Get global feed | Public |
| GET | `/communities/{communityId}/posts` | Get community feed | Public |
| GET | `/user/{userId}` | Get user's posts | Public |
| GET | `/user/{userId}/saved` | Get user's saved posts | Public |
| GET | `/user/{userId}/upvoted` | Get user's upvoted posts | Public |
| GET | `/saved` | Get own saved posts | Authenticated |
| GET | `/upvoted` | Get own upvoted posts | Authenticated |
| GET | `/{id}` | Get post detail | Public |
| PUT | `/{id}` | Update post | Authenticated |
| DELETE | `/{id}` | Delete post | Authenticated |
| POST | `/{id}/save` | Save post | Authenticated |
| DELETE | `/{id}/save` | Unsave post | Authenticated |
| POST | `/{id}/pin` | Pin post in community | Authenticated (mod) |
| POST | `/{id}/unpin` | Unpin post | Authenticated (mod) |
| POST | `/{postId}/vote` | Vote on post | Authenticated |

### Comments (`/api/posts/{postId}/comments`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/` | Create comment | Authenticated |
| GET | `/` | List comments | Public |
| DELETE | `/{commentId}` | Delete comment | Authenticated |
| PUT | `/{commentId}` | Edit comment | Authenticated |
| POST | `/{commentId}/vote` | Vote on comment | Authenticated |

### Notifications (`/api/notifications`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/` | List notifications | Authenticated |
| GET | `/unread-count` | Get unread count | Authenticated |
| PUT | `/{id}/read` | Mark as read | Authenticated |
| PUT | `/read-all` | Mark all as read | Authenticated |

### Q&A (`/api/questions`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/` | Ask question | Authenticated |
| GET | `/` | List questions | Public |
| GET | `/{id}` | Get question detail | Public |
| DELETE | `/{id}` | Delete question | Authenticated |
| POST | `/{id}/answers` | Post answer | Authenticated |
| PUT | `/{id}/answers/{answerId}/accept` | Accept answer | Authenticated |
| DELETE | `/{questionId}/answers/{answerId}` | Delete answer | Authenticated |

### DM (`/api/conversations`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/` | Create conversation | Authenticated |
| GET | `/` | List conversations | Authenticated |
| GET | `/{id}/messages` | Get messages | Authenticated |
| POST | `/{id}/messages` | Send message | Authenticated |

### Search (`/api/search`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/?q=&type=&page=&size=` | Global search | Public |

### Storage (`/api/storage`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/upload` | Upload file | Authenticated |
| GET | `/download/{*objectName}` | Download file | Public |
| GET | `/url/{*objectName}` | Get presigned URL | Public |
| DELETE | `/{*objectName}` | Delete file | Authenticated |

### Anonymous (`/api/anonymous`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/session` | Create anonymous session | Public |
| GET | `/me` | Get identity via X-Anonymous-Token | Public |
| POST | `/heartbeat` | Update last active | Public |

### GIF (`/api/gifs`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/search?q=` | Search GIPHY | Authenticated |

---

## Part 5 — Database Audit

**36 Flyway Migrations (V1–V36, no gaps), 24 tables, 2 enums**

### Tables (24)

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | Auth credentials | PK for all user relationships |
| `user_profiles` | Display info | FK → users (1:1) |
| `user_settings` | User preferences | FK → users (1:1) |
| `anonymous_identities` | Anonymous sessions | Standalone (no FK) |
| `communities` | Community groups | FK → users (owner) |
| `community_members` | Membership | FK → communities, FK → users |
| `community_invites` | Invitations | FK → communities, FK → users |
| `community_invite_links` | Shareable invite links | FK → communities |
| `community_join_requests` | Join requests | FK → communities, FK → users |
| `community_rules` | Community rule sets | FK → communities |
| `community_bans` | Banned members | FK → communities, FK → users |
| `moderation_log` | Moderation history | FK → communities, FK → users |
| `posts` | User posts | FK → users, FK → communities (nullable) |
| `post_anonymous_map` | Anonymous post mapping | FK → posts (PK), FK → users |
| `post_votes` | Post likes/dislikes | FK → posts, FK → users |
| `post_saves` | Saved posts | FK → posts, FK → users |
| `comments` | Post comments | FK → posts, FK → users, FK → comments (parent) |
| `comment_votes` | Comment votes | FK → comments, FK → users |
| `follows` | User follows | FK → users (follower), FK → users (followed) |
| `blocks` | User blocks | FK → users (blocker), FK → users (blocked) |
| `mutes` | User mutes | FK → users (muter), FK → users (muted) |
| `reports` | User reports | FK → users (reporter), FK → users (reported) |
| `notifications` | User notifications | FK → users |
| `conversations` | DM threads | PK for participants |
| `conversation_participants` | DM membership | FK → conversations, FK → users |
| `messages` | DM messages | FK → conversations, FK → users |
| `projects` | User project showcase | FK → users |
| `questions` | Q&A questions | FK → users (author) |
| `answers` | Q&A answers | FK → questions, FK → users |

### Enums (2)

| Enum | Values |
|------|--------|
| `post_type` | GENERAL, ACHIEVEMENT, PROJECT, JOB |
| `notification_type` | FOLLOW, COMMENT, LIKE, MENTION, INVITE |

### Important Constraints
- `follows`: UNIQUE(follower_id, followed_id), CHECK(follower_id != followed_id)
- `blocks`: UNIQUE(blocker_id, blocked_id), CHECK(blocker_id != blocked_id)
- `mutes`: UNIQUE(muter_id, muted_id)
- `community_members`: UNIQUE(community_id, user_id)
- `post_votes`: UNIQUE(post_id, user_id)
- `post_saves`: UNIQUE(post_id, user_id)
- `comment_votes`: UNIQUE(comment_id, user_id)

---

## Part 6 — Missing Features

### P1 — Critical

| # | Feature | Issue | Location |
|---|---------|-------|----------|
| 1 | **Settings API broken** | `UserSettingsController` uses `@AuthenticationPrincipal UUID userId` but AuthPrincipal is not UUID. GET/PUT `/api/settings` always fail. | `backend/.../settings/UserSettingsController.java` |
| 2 | **JWT filter no 401** | On token validation failure, filter clears context and continues. Anonymous users reach authenticated endpoints, get confusing 400 instead of 401. | `backend/.../auth/JwtAuthenticationFilter.java` |
| 3 | **Global exception handler incomplete** | No handler for `AccessDeniedException`, `EntityNotFoundException`, `HttpMessageNotReadableException`, generic `Exception`. Unhandled errors leak stack traces. | `backend/.../config/GlobalExceptionHandler.java` |

### P2 — Important

| # | Feature | Issue | Location |
|---|---------|-------|----------|
| 4 | **Save Post (frontend placeholder)** | `savePost()` uses `console.warn("Backend endpoint missing")` + `alert()`. Backend has the endpoint, frontend just doesn't call it. | `frontend/.../post-actions-menu.component.ts:219` |
| 5 | **Follow Post (simulated only)** | `followPost()` uses same placeholder pattern. No backend endpoint exists for following posts. | `frontend/.../post-actions-menu.component.ts:226` |
| 6 | **Report Post (simulated)** | `submitReport()` uses `console.warn("Backend endpoint for POSTS missing")` + `alert("Simulated")`. Backend only has user reporting, not post reporting. | `frontend/.../post-actions-menu.component.ts:256-258` |
| 7 | **Post actions "Soon" badges** | Pin Post, View Insights, Add To Collection all disabled with "Soon" badge. | `frontend/.../post-actions-menu.component.ts:36-41,58-60` |
| 8 | **Notification N+1** | `markAllAsRead()` fetches all then saves individually | `backend/.../notification/NotificationService.java` |
| 9 | **Feed doesn't filter banned users** | CommunityBan table exists but `PostService` feed queries don't exclude banned users' posts from community feeds | `backend/.../post/PostService.java` |
| 10 | **Comment replies no notification** | Reply to a comment doesn't notify the parent comment author — only notifies post author | `backend/.../comment/CommentService.java` |
| 11 | **`alert()` instead of toast** | Several components use `alert()` instead of `ToastService`: post-actions-menu (copy link, save, report), feed-page (copy link), profile-view, post-detail | Multiple frontend files |

### P3 — Future

| # | Feature | Issue | Location |
|---|---------|-------|----------|
| 12 | **Password Reset** | No forgot-password flow, no reset token endpoint | Backend |
| 13 | **Email Verification** | Email is hashed and stored, never verified | Backend |
| 14 | **Admin Panel** | Role column exists but only USER value used. No admin UI or permissions | Both |
| 15 | **2FA Frontend UI** | Backend TOTP complete (V32/V34). No settings UI to enable/disable | Frontend |
| 16 | **Mute Frontend UI** | Backend mute complete (V35). No frontend button/modal to mute a user | Frontend |
| 17 | **Accent Color Frontend** | Backend accent_color column (V36) + `app.component.ts` applies `--primary` CSS var. No settings UI to pick a color | Frontend |
| 18 | **Answer Editing** | No answer edit or answer delete endpoints | Backend: `QnaController` |
| 19 | **CORS hardcoded** | `http://localhost:4200` hardcoded. Not configurable for production | `backend/.../config/CorsConfig.java` |
| 20 | **SQL injection risk in Search** | Native UNION ALL query uses string concatenation (though with some param sanitization via `'` replacement) | `backend/.../search/SearchService.java` |
| 21 | **Comment depth unlimited** | No depth limit on nested replies — could lead to UI issues | Backend + Frontend |
| 22 | **Post type filter missing** | No query param to filter posts by type (GENERAL/ACHIEVEMENT/PROJECT/JOB) | Backend: PostController |
| 23 | **Unused method** | `PostRepository.findAllByOrderByCreatedAtDesc()` exists but is never used | Backend |

---

## Part 7 — Final Status Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Registration | ✅ Complete | — |
| Login | ✅ Complete | — |
| JWT Cookie Auth | ✅ Complete | HttpOnly + SameSite Strict |
| Logout | ✅ Complete | Cookies cleared |
| Password Change | ✅ Complete | — |
| Password Reset | ❌ Missing | No forgot-password flow |
| Email Verification | ❌ Missing | SHA-256 hash stored, never verified |
| Role System | ⚠️ Partial | Only USER role in use |
| Anonymous Browsing | ✅ Complete | Session tokens + random display names |
| Profile Page | ✅ Complete | Own profile with edit |
| Other User Profile | ✅ Complete | Public with follow/block/report |
| Avatar Upload/Crop | ✅ Complete | Canvas cropper + MinIO |
| Profile Editing | ✅ Complete | Bio, website, location |
| Follow/Unfollow | ✅ Complete | With notifications |
| Settings API | 🔴 **Broken** | `@AuthenticationPrincipal` type mismatch |
| Theme Switching | ✅ Complete | Dark/light toggle in settings |
| Notification Toggles | ✅ Complete | Comments, replies, mentions, follows, system |
| Privacy Settings | ✅ Complete | Email/website/location visibility |
| 2FA Setup (frontend) | ❌ Missing | Backend complete, no frontend |
| Create Post | ✅ Complete | Markdown editor, anonymous toggle |
| Edit/Delete Post | ✅ Complete | With anonymous toggle |
| Post Feed | ✅ Complete | Global + community, paginated |
| Post Detail | ✅ Complete | Full view + comments |
| Save Post (frontend) | ⚠️ Partial | Backend complete, frontend uses placeholder |
| Follow Post | ❌ Missing | Simulated only |
| Report Post (posts) | ❌ Missing | Only user-reporting exists |
| Like/Dislike | ✅ Complete | Unified action bar |
| Pin/Unpin | ✅ Complete | Community mods |
| Scheduled Posts | ✅ Complete | 60s cron publishing |
| Comment CRUD | ✅ Complete | Create, edit, delete |
| Nested Replies | ✅ Complete | Via parentId |
| @Mentions | ✅ Complete | With notification |
| GIF Picker | ✅ Complete | GIPHY API integration |
| Markdown Rendering | ✅ Complete | Write/Preview tabs |
| Community CRUD | ✅ Complete | Public/private |
| Membership | ✅ Complete | Join, leave, invite |
| Roles (Owner/Admin/Mod) | ✅ Complete | With hierarchy enforcement |
| Invite Links | ✅ Complete | Shareable codes |
| Join Requests | ✅ Complete | Private community flow |
| Community Rules | ✅ Complete | CRUD with ordering |
| Bans | ✅ Complete | With duration/expiry |
| Mod Log | ✅ Complete | Tracks all actions |
| Community Analytics | ✅ Complete | Members, posts, comments, active authors |
| Notifications (STOMP) | ✅ Complete | Real-time push |
| Mark Read / Read All | ✅ Complete | (N+1 issue in read-all) |
| Notify Reply Author | ❌ Missing | Only notifies post author |
| Role Change Notification | ❌ Missing | — |
| Search (GIN) | ✅ Complete | Full-text across 3 entity types |
| Search Type Filter | ⚠️ Partial | Client-side only |
| Privacy Policy | ✅ Complete | Static page |
| Terms & Conditions | ✅ Complete | Static page |
| Registration Consent | ✅ Complete | Checkbox + validation |
| MinIO Storage | ✅ Complete | S3-compatible |
| Image/Video Upload | ✅ Complete | With type whitelist |
| DM Conversations | ✅ Complete | REST + STOMP |
| DM Real-time Chat | ✅ Complete | STOMP messaging |
| Q&A Questions | ✅ Complete | CRUD |
| Q&A Answers | ✅ Complete | Accept, delete |
| Q&A Answer Edit | ❌ Missing | — |
| Projects | ✅ Complete | CRUD per-user |
| Mobile Responsive | ✅ Complete | 320–767px |
| Tablet Responsive | ✅ Complete | 768–1023px |
| Ultrawide Responsive | ✅ Complete | 1440px+ |
| Touch Optimization | ✅ Complete | 44px targets, safe area |
| CSS Design Tokens | ✅ Complete | Variables for everything |
| Sidebar Drawer | ✅ Complete | Overlay on mobile |
| Tests | ❌ Missing | Zero test files throughout |
| CI/CD | ✅ Complete | GitHub Actions build-only |

---

**Overall**: Backend ~95% complete, Frontend ~80% complete, Database 100% complete. The main gaps are: 3 critical bugs (Settings API broken, JWT filter no-401, exception handler incomplete), 7 important frontend placeholders (Save/Follow/Report/Pin/Insights), and 6 missing frontend UIs for backend features (2FA, Mute, Accent Color, Password Reset, Email Verification, Admin Panel).
