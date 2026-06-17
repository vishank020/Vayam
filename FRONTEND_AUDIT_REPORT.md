# Vayam Frontend Audit Report

**Generated**: 2026-06-17 | **Scope**: Static analysis (Angular 18, standalone components, inline templates)
**Backend availability**: Not running — dynamic behaviors flagged with ⚠️

---

## Phase 1: Structured Inventory

### Component Tree (36 standalone components)

```
AppComponent (app-root)
├── AppHeaderComponent (app-header)
│   └── NotificationBellComponent (app-notification-bell)
├── AppSidebarComponent (app-sidebar)
├── <router-outlet>
│   ├── LoginComponent
│   ├── RegisterComponent
│   ├── FeedPageComponent
│   ├── PostDetailComponent
│   │   └── CommentListComponent
│   │       └── CommentComponent (recursive, depth 0/1)
│   │           ├── CommentActionsMenuComponent
│   │           ├── GifPickerComponent
│   │           └── MarkdownEditorComponent
│   ├── CreatePostComponent
│   ├── EditPostComponent
│   ├── ProfileComponent (own profile)
│   │   ├── PostActionsMenuComponent
│   │   └── ProjectListComponent
│   ├── ProfileViewComponent (other user)
│   │   ├── PostActionsMenuComponent
│   │   └── ProjectListComponent
│   ├── CommunityListComponent
│   ├── CommunityDetailComponent
│   │   ├── PostActionsMenuComponent
│   │   └── ImageCropperComponent
│   ├── CreateCommunityComponent
│   ├── QuestionListComponent
│   ├── AskQuestionComponent
│   ├── QuestionDetailComponent
│   ├── SearchPageComponent
│   ├── SettingsPageComponent
│   ├── AdminPageComponent
│   ├── DmListComponent
│   ├── DmChatComponent
│   ├── DraftsPageComponent
│   ├── PrivacyPolicyComponent
│   └── TermsAndConditionsComponent
├── ToastContainerComponent
└── AnonymousExitModalComponent
```

### Shared/Reusable Components
- **MarkdownEditorComponent** — used in create/edit post, comment/reply forms, question/answer forms
- **PostActionsMenuComponent** — used in feed, post detail, profile, community detail
- **CommentListComponent + CommentComponent + CommentActionsMenuComponent** — post detail
- **GifPickerComponent** — used in comment list + comment reply forms
- **ProjectListComponent + ProjectFormComponent** — profile pages
- **NotificationBellComponent** — header
- **ToastContainerComponent** — app shell
- **AnonymousExitModalComponent** — app shell

### Route Table (19 route patterns)

| Path | Component | Guard | Auth Required |
|---|---|---|---|
| `/login`, `/register` | Login, Register | none | No |
| `/feed` | FeedPage | none | No |
| `/posts/:id` | PostDetail | none | No |
| `/posts/new`, `/posts/:id/edit` | Create/EditPost | authGuard | Yes |
| `/u/:username` | ProfileView | none | No |
| `/profile` | Profile | authGuard | Yes |
| `/communities`, `/c/:slug`, `/communities/:id`, `/communities/join/:code` | CommunityList/Detail | none | No |
| `/communities/new` | CreateCommunity | authGuard | Yes |
| `/questions`, `/questions/:id` | QuestionList/Detail | none | No |
| `/questions/new` | AskQuestion | authGuard | Yes |
| `/search` | SearchPage | none | No |
| `/settings` | SettingsPage | authGuard | Yes |
| `/dm`, `/dm/:id` | DmList/DmChat | authGuard | Yes |
| `/admin` | AdminPage | adminGuard | Yes |
| `/drafts` | DraftsPage | authGuard | Yes |
| `/privacy-policy`, `/terms-and-conditions` | Static pages | none | No |
| `/` | redirect → `/feed` | — | — |
| `**` | redirect → `/login` | — | — |

### Services (19, all `providedIn: 'root'`)

Auth, Post, Comment, User, Follow, Community, Dm, Notification, Qna, Search, Settings, Project, Admin, Toast, Theme, Sidebar, WebSocket, Anonymous, AnonymousBrowsing

### Infrastructure
- **Guards**: `authGuard` (checks `/api/auth/me`), `adminGuard` (checks `role === 'ADMIN'`)
- **Interceptor**: `authInterceptor` (sets `withCredentials: true`, handles 401)
- **Pipe**: `safe` (DomSanitizer bypass for iframes)
- **Utility**: `timeAgo()` — relative timestamp formatting

---

## Phase 2: Component-Level Audit

### AppShell

#### AppComponent (`app-root`)
- ✅ Initializes theme & accent color from user settings on auth
- ✅ Falls back to localStorage theme for unauthenticated users
- ✅ Subscribes to sidebar open/close via `SidebarService`
- ✅ Closes sidebar on `NavigationEnd` (route change)
- ✅ Responsive: sidebar backdrop click closes on <1024px
- ⚠️ **Memory leak**: `router.events.subscribe()` in constructor — never unsubscribed; will persist for component lifetime (which is application lifetime, so acceptable but flagged)
- ⚠️ **Memory leak**: `sidebarService.open$.subscribe()` in constructor — never unsubscribed; same reasoning applies

#### AppHeaderComponent (`app-header`)
- ✅ Search bar with `(keyup.enter)` triggers /search route
- ✅ Avatar dropdown with profile/settings/drafts/anonymous-toggle/logout
- ✅ Anonymous banner at top when anonymous mode active
- ✅ Create Post button with anonymous interception
- ✅ Dropdown closes on document click (HostListener)
- ✅ Responsive: hamburger shown ≤1023px, search bar shrinks on mobile
- ⚠️ `loading = true` field declared but never set to `false` — unused state
- ⚠️ `checkAuth().subscribe()` in `ngOnInit` with no error handling — could silently fail

#### AppSidebarComponent (`app-sidebar`)
- ✅ Feed refresh on re-click (navigates to `/feed` via skipLocationChange)
- ✅ Closes sidebar on nav click via `SidebarService.close()`
- ✅ Conditional Profile link (only when authenticated)
- ✅ Legal links at bottom, version number
- ⚠️ Privacy Policy and Terms links use `href` instead of `routerLink` — causes full page reload

#### ToastContainerComponent (`app-toast-container`)
- ✅ Displays stacked toasts at bottom-center with slide-up animation
- ✅ Undo button for deletable actions
- ✅ Close button for info toasts
- ⚠️ **No visual distinction** between success, error, and info toasts — all have same `var(--text-main)` background with `var(--bg-main)` text. The `ToastService` has `showSuccess()`, `showError()`, and `show()` methods but they all produce identical styling. Success/error are functionally identical.

#### AnonymousExitModalComponent (`app-anonymous-exit-modal`)
- ✅ Reacts to `exitPrompt$` Subject from `AnonymousBrowsingService`
- ✅ Disable button calls `setAnonymousMode(false)`
- ✅ Properly unsubscribes on destroy

### Auth

#### LoginComponent (`app-login`)
- ✅ Two-step login flow: username/password → 2FA code entry
- ✅ Form validation with template-driven forms
- ✅ Error display from API
- ✅ Redirects to `/feed` on success
- ✅ Legal links at bottom
- ⚠️ When `requires2fa = false` and no `tempToken` (edge case), navigates to `/feed` even without checking response shape

#### RegisterComponent (`app-register`)
- ✅ Validation: username (min 3), email (valid), password (min 8), displayName (optional)
- ✅ Terms consent checkbox with custom error display
- ✅ Navigates to `/profile` on success (assumes auto-login)
- ⚠️ `acceptedTerms` is sent as `true` — no actual terms version tracking

### Feed

#### FeedPageComponent (`app-feed-page`)
- ✅ Paginated feed with vote/unvote, save/unsave, share
- ✅ Optimistic updates with rollback on API error
- ✅ Anonymous browsing interceptor on voting/saving
- ✅ Undo on delete/hide via toast
- ✅ Edited/Edited badge via `updatedAt > createdAt + 1s`
- ✅ First media image preview extraction
- ✅ Touch-friendly pill buttons (44px min)
- ⚠️ `onPostDeleted` has a logic bug: emits `deleteRequested` to parent which removes post, then calls `showUndo`. If user clicks Undo, the post is restored AND the toast emits `confirmed = true` which calls `deletePost()`. The flow should be: undo means don't delete; confirmed means do delete. Currently: removing from array happens before undo, and undo restores + confirms delete. **This is confirmed reversed logic.**
- ⚠️ Same bug in `onPostHidden`

### Post

#### PostDetailComponent (`app-post-detail`)
- ✅ Full post with Markdown-rendered content, media images/video/YouTube embeds
- ✅ Action bar: vote, save, share, comment scroll
- ✅ Edited detection and label
- ✅ PostActionsMenu wired with delete/undo
- ⚠️ **No error handling for missing/invalid YouTube URLs** — `getYouTubeEmbedUrl` will return the original URL if regex doesn't match
- ⚠️ `scrollIntoView` for comments section is fragile — depends on class name

#### CreatePostComponent (`app-create-post`)
- ✅ Rich form: title, markdown content, media upload (up to 4 files, 10MB each), type, community, tags, anonymous, scheduling, drafts
- ✅ File validation (type + size)
- ✅ ObjectURL cleanup in `ngOnDestroy`
- ✅ Community tagging and locked-community parameter support
- ⚠️ **Hardcoded `/api` URL for settings-page cover upload** (line 685: `'/api/storage/upload'`) — should use `environment.apiUrl`
- ⚠️ Community list loaded with page 0, size 100 — no pagination for large communities

#### EditPostComponent (`app-post-detail`)
- ✅ Pre-fills form from existing post
- ✅ Minimal UI: title, content, type, anonymous toggle
- ⚠️ **No community editing** — community cannot be changed on edit
- ⚠️ **No media management** — cannot add/remove media on edit
- ⚠️ No draft/intermediate save

### Profile

#### ProfileComponent (own profile, `app-profile`)
- ✅ Cover + avatar with crop modal (ngx-image-cropper)
- ✅ Inline editing of displayName, bio, location, website
- ✅ Tabs: Posts, Comments, Saved, Upvoted, Projects
- ✅ Pagination on all tab data
- ✅ Follow counts display
- ✅ Vote/save/share on posts within tabs
- ✅ Avatar upload via storage API with prefix `avatars`
- ⚠️ **Hardcoded `/api/storage/upload` on line 685** — should use `environment.apiUrl`
- ⚠️ `onCoverSelect` uses hardcoded `/api/storage/upload` for cover upload
- ⚠️ `sharePost` uses `alert()` for clipboard fallback instead of toast
- ⚠️ Saved tab shows posts but doesn't recalculate saved state; user must manually unsave

#### ProfileViewComponent (other user, `app-profile-view`)
- ✅ Follow/unfollow with optimistic update
- ✅ Message button navigates to DM
- ✅ Dropdown: copy link, mute, block, report
- ✅ Block/unblock with full UI overlay
- ✅ Report form with reason textarea
- ✅ Only posts/comments/projects tabs (no saved/upvoted)
- ⚠️ `message()` navigates to `/dm/:username` but DM routes expect conversation ID (`/dm/:id`). The DM chat component uses the route param as conversation ID, not username. This navigation will fail.

### Community

#### CommunityDetailComponent (`app-community-detail`)
- ✅ Massive 1801-line component with 9+ sub-sections: posts (with type + tag filters), about (rules), members (filterable, role management), settings (branding with crop, name/desc/visibility, rules, tags), analytics, invites, bans, mod log, ownership transfer
- ✅ Avatar + banner cropping via ngx-image-cropper
- ✅ Role-based permission checks (canManage, canInvite, canPromote)
- ✅ Join by invite link, join requests, leave, delete
- ✅ Member search + role filter
- ⚠️ **Extremely large component (1801 lines)** — violates single-responsibility; should be split into sub-components (e.g., MemberListComponent, CommunitySettingsComponent, CommunityPostsComponent etc.)
- ⚠️ `loadPosts()` uses raw `HttpClient` with manually constructed URL instead of `CommunityService`
- ⚠️ Route logic: if `id` param is UUID, loads community by ID then redirects to `/c/:slug`. If not UUID, navigates to `/c/:slug`. This double-navigation could cause flash.

#### CommunityListComponent (`app-community-list`)
- ✅ Paginated community listing
- ✅ Click to navigate to community detail
- ✅ Avatar with fallback initials
- ⚠️ No search/filter within the list

#### CreateCommunityComponent (`app-create-community`)
- ✅ Auto-slugify from name with manual override
- ✅ Radio selection for visibility (Public/Private)
- ⚠️ Only PUBLIC/PRIVATE options — no RESTRICTED option despite `RESTRICTED` being in the enum and supported by the backend

### Comments

#### CommentListComponent (`app-comment-list`)
- ✅ Markdown editor with mention (@) support and GIF picker
- ✅ Login prompt for unauthenticated users
- ✅ Nested replies (top-level only, depth limit enforced in child)
- ✅ Undo on delete
- ⚠️ `mention` detection regex `@(\\w*)$` — double backslash in template string means literal backslash + `\w`; actually the raw string `@(\\w*)$` in the JS source is `@(\w*)$` which is correct regex for word characters. **No issue here.**
- ⚠️ `fetchMentions()` is called on every keystroke — no debounce

#### CommentComponent (`app-comment`)
- ✅ Single comment with voting, reply form, inline editing
- ✅ Nested reply with depth-1 flattening (replies to replies become top-level replies)
- ✅ Markdown rendering via `marked`
- ✅ Mention support in reply form
- ⚠️ Comment timestamp uses Angular `date:'short'` pipe — inconsistent with feed which uses `timeAgo()`. **Violates AGENTS.md convention** which specifies `timeAgo()` everywhere, never Angular Date pipe.

#### CommentActionsMenuComponent (`app-comment-actions-menu`)
- ✅ Three-dot menu with edit/delete (owner) and save/follow/report/copy-link/view-profile (viewer)
- ⚠️ `saveComment()` and `followComment()` are **placeholders only** — show `alert()` and log warnings. Backend endpoints do not exist for comment save/follow.
- ⚠️ `submitReport()` is **simulated** — logs warning and shows alert. Comment report endpoint is not implemented.
- ⚠️ `copyLink()` uses `alert()` instead of toast

#### GifPickerComponent (`app-gif-picker`)
- ✅ Searches GIPHY via backend proxy endpoint
- ✅ Displays results in 2-column grid
- ✅ Emits selected GIF URL
- ⚠️ No trending/default GIFs shown on open — user must search

### Q&A

#### QuestionListComponent (`app-question-list`)
- ✅ Paginated question listing
- ✅ Stats: answer count
- ⚠️ No search/filter (by answered/unanswered, tags, etc.)

#### AskQuestionComponent
- ⚠️ Simple title + body form — no tags, no draft save
- ⚠️ No markdown editor integration visible (assumed plain textarea)

#### QuestionDetailComponent
- ✅ Answers list with accept/delete
- ✅ New answer form
- ⚠️ No voting on questions/answers, no comments on answers

### DM

#### DmListComponent (`app-dm-list`)
- ✅ Conversation listing with last message preview
- ✅ Start conversation by searching username
- ⚠️ No WebSocket/STOMP integration — real-time message delivery not implemented on frontend
- ⚠️ `searchUsername` navigates to `/dm` on success (no conversation ID param handling if backend returns redirect)

#### DmChatComponent (`app-dm-chat`)
- ✅ Message list with sent/received styling
- ✅ Send message via API
- ⚠️ No auto-scroll to bottom on new message
- ⚠️ No WebSocket for real-time updates — requires manual refresh
- ⚠️ No typing indicators, read receipts, or message status

### Search

#### SearchPageComponent (`app-search-page`)
- ✅ Query parameter syncing (reads `q` and `type` from URL)
- ✅ Type filter: All, Posts, Communities, Users
- ✅ Paginated results
- ⚠️ No debounce on search — fires immediately on URL change
- ⚠️ `totalPages` calculation: `Math.ceil(res.total / res.size)` — could be off by one if `res.totalPages` is available from backend

### Settings

#### SettingsPageComponent (`app-settings-page`)
- ✅ Sections: Appearance (theme/accent), Notifications (toggles), Privacy (toggles), Security (2FA setup+disable, password change), About
- ✅ Accent color picker with live preview
- ✅ Theme: system/light/dark
- ⚠️ **No email change option** — email is set at registration and cannot be changed
- ⚠️ 2FA flow involves separate `generate2fa()`, `enable2fa()`, `disable2fa()` calls — needs runtime verification for state handling

### Admin

#### AdminPageComponent (`app-admin-page`)
- ✅ Reports queue with OPEN/RESOLVED filtering
- ✅ User lookup with search, mute/unmute
- ✅ View user reports redirects to reports tab
- ⚠️ Admin can mute users but not delete posts/comments from admin panel (no such buttons)
- ⚠️ No ability to delete users

### Drafts

#### DraftsPageComponent (`app-drafts-page`)
- ✅ Lists post drafts + answer drafts separately
- ✅ Post drafts link to edit page; answer drafts link to question
- ⚠️ No pagination for large draft lists
- ⚠️ No delete draft action (only links to continue editing)

---

## Phase 3: Page-Level Audit

### Missing/Wrong Navigations
- `ProfileViewComponent.message()` navigates to `/dm/:username` but DM chat expects conversation ID — **will break**
- Terms/Privacy links in sidebar use `href` instead of `routerLink` — full page reload
- Inter-component: comment actions menu `copyLink()` navigates to `#comment-{id}` but no anchor exists in post detail template

### Responsive Issues
- Post detail: maximum content width is 680px on desktop (good for readability)
- Feed: 680px max + padding adjustments at breakpoints
- Community detail: full-width responsive with wrapping
- Profile: avatars/images shrink proportionally
- **No horizontal overflow issues detected**
- **No hardcoded width values** — all use CSS variables and responsive calc
- **Touch target min 44px** consistently applied on action pills

### Authentication Gaps
- Anonymous browsing interception is consistent across vote/save/follow/report actions
- Feed, community, search, and Q&A pages are public (correct per AGENTS.md)
- Auth-only pages correctly guarded (settings, profile, dm, admin, create/edit post, drafts)

### Form Validation
- Login/Register forms: template-driven with required/minlength/email/pattern validation
- Create/Edit Post: required title + markdown editor
- Settings: select/checkbox/toggle inputs, no complex validation
- All forms handle errors from API responses

### Error Handling
- ✅ All components handle API errors with fallback UI or toast messages
- ✅ Loading states present in all data-fetching components
- ✅ `ProfileViewComponent` redirects own profile to `/profile`
- ⚠️ No global error boundary — unhandled errors crash component
- ⚠️ No offline/detached state handling

---

## Phase 4: Cross-Cutting Audit

### Auth Interceptor
- ✅ Sets `withCredentials: true` on all requests
- ✅ 401 response → attempts silent re-auth (logout, navigate to login)
- ✅ Non-auth errors show toast with status code message
- ⚠️ No token refresh logic (backend handles this via HttpOnly cookies, so acceptable)
- ⚠️ No loading indicator integration

### Guards
- `authGuard`: ✅ Checks `isLoggedIn()`, redirects to `/login?redirectUrl={current}`
- `adminGuard`: ✅ Checks `user.role === 'ADMIN'`, redirects to `/feed`
- ⚠️ Both guards subscribe to `checkAuth()` which makes an HTTP call — this means every guarded route navigation triggers a backend request to `/api/auth/me`

### Shared Components
- `MarkdownEditorComponent`: ✅ Well-designed with toolbar, Write/Preview tabs, cursor tracking, `insertAtCursorPos()`
- `PostActionsMenuComponent`: ✅ Owner vs viewer menus, report modal, copy link
- `CommentActionsMenuComponent`: ✅ Same pattern as post actions menu
- `GifPickerComponent`: ✅ Backend proxy, works without API key degrading gracefully
- `ProjectListComponent`/`ProjectFormComponent`: ✅ Standard CRUD with edit/delete

### WebSocket
- `WebSocketService` connects to `/ws` with SockJS
- Subscribes to `/user/queue/notifications`
- NotificationBellComponent triggers connect on init
- ⚠️ No reconnection logic visible — if WebSocket disconnects, notifications stop
- ⚠️ No explicit disconnect on logout

### Routing
- All routes lazy-loaded via `loadComponent()`
- Route structure is clean and logical
- `**` wildcard redirects to `/login` — not great UX; should redirect to `/feed` since feed is public

---

## Phase 5: Missing Features / Gaps Report

### Critical Issues

| # | Issue | Location | Severity | Notes |
|---|---|---|---|---|
| C1 | `onPostDeleted()` undo logic reversed — undo triggers actual delete | FeedPageComponent:296, ProfileComponent:732, ProfileViewComponent:688, CommunityDetailComponent:1281 | **Critical** | Undo should cancel the action; currently undoing triggers the delete |
| C2 | DM message button navigates to wrong URL | ProfileViewComponent:550 | **High** | `/dm/:username` vs `/dm/:conversationId` |
| C3 | Hardcoded `/api/storage/upload` in ProfileComponent | ProfileComponent:685, 632 | **High** | Should use `environment.apiUrl` |
| C4 | Comment report endpoint not implemented (simulated with alert) | CommentActionsMenuComponent:246 | **High** | Backend missing; UI shows fake success |
| C5 | Comment save/follow are placeholders | CommentActionsMenuComponent:214, 221 | **High** | No backend endpoint |
| C6 | `ProfileViewComponent.message()` navigates to wrong route | ProfileViewComponent:550 | **High** | Uses username where conversation ID is expected |

### Moderate Issues

| # | Issue | Location | Severity | Notes |
|---|---|---|---|---|
| M1 | No real-time WebSocket for DM | DmChatComponent | **Medium** | Messages require manual refresh |
| M2 | No visual toast distinction for success/error | ToastContainerComponent | **Medium** | `showSuccess` and `showError` render identically |
| M3 | CommunityDetailComponent is 1801 lines | community-detail.component.ts | **Medium** | Should be split into focused sub-components |
| M4 | No debounce on mention search | CommentListComponent:175 | **Medium** | Fires API call on every keystroke |
| M5 | Community creation lacks RESTRICTED visibility | CreateCommunityComponent | **Medium** | Only PUBLIC/PRIVATE offered |
| M6 | Feed `**` wildcard redirects to /login | app.routes.ts:148 | **Medium** | Should redirect to /feed (public) |
| M7 | Comment Action Menu `copyLink()` uses `alert()` | CommentActionsMenuComponent:205 | **Medium** | Inconsistent with post actions (uses toast) |
| M8 | No logged-in check for voting on feed posts | FeedPageComponent:346 | **Medium** | Anon interception blocks action but no login redirect |

### Minor Issues

| # | Issue | Location | Severity | Notes |
|---|---|---|---|---|
| m1 | Comment timestamp uses Angular `date:'short'` pipe | CommentComponent:32 | **Low** | Violates AGENTS.md convention — should use `timeAgo()` |
| m2 | `loading = true` never set false in AppHeader | AppHeaderComponent:370 | **Low** | Dead state field |
| m3 | No trending GIFs on GifPicker open | GifPickerComponent | **Low** | User must search manually |
| m4 | No pagination on drafts page | DraftsPageComponent | **Low** | Could have many drafts |
| m5 | No email change in settings | SettingsPageComponent | **Low** | Intentional design? Not documented |
| m6 | Router events subscription not cleaned up | AppComponent:78 | **Low** | Acceptable since it lives for app duration |
| m7 | YouTube URL regex may fail on shorts/playlist URLs | PostDetailComponent:428 | **Low** | Only handles standard watch and youtu.be |
| m8 | Privacy/terms links in sidebar use href not routerLink | AppSidebarComponent:47-48 | **Low** | Causes full page reload |

### Architectural Observations

- **No NgModules** — fully standalone (Angular 18 convention), correct
- **No model files** — all interfaces inline in services; acceptable for medium project but could benefit from shared types
- **No loading interceptor** — each component manages its own loading state; no global spinner
- **No caching layer** — every navigation re-fetches data; could benefit from Angular HTTP transfer cache or a simple state store
- **Duplicate vote/save code** — the optimistic update logic for toggleVote/toggleSave is duplicated across FeedPage, ProfileComponent, ProfileViewComponent, CommunityDetailComponent, and PostDetailComponent. This is ~100 lines of identical code repeated in 5 places.

### Security Observations
- ✅ HttpOnly cookies for JWT — no token exposure to JS
- ✅ No sensitive data in URL params
- ✅ Anonymous exit modal guards identity-required actions
- ⚠️ No rate limiting feedback on frontend (backend handles this)
- ⚠️ No XSS protection beyond Angular's built-in sanitization (which is good)

---

## Phase 6: Executive Summary

### Health Score: 72/100

| Category | Score | Notes |
|---|---|---|
| Component Completeness | 18/20 | All planned features have UI components |
| API Integration | 14/20 | 3 endpoints missing backend (comment report, comment save, comment follow); 2 wrong URLs |
| State Management | 7/10 | Optimistic updates good; no global state store; memory leaks in AppComponent |
| Forms & Validation | 9/10 | Template-driven forms with good validation; consistent patterns |
| Responsive Design | 10/10 | Excellent responsive system with CSS variables, breakpoints, touch targets |
| Error Handling | 7/10 | API errors handled; no global error boundary; no offline state |
| Code Quality | 7/20 | Massive duplication (vote/save logic in 5 files); 1801-line component; inconsistent patterns |

### Strengths
1. **Consistent component architecture** — all standalone, inline templates, well-organized imports
2. **Excellent responsive design** — CSS variable system, proper breakpoints, touch-friendly targets
3. **Optimistic UI updates** with rollback on API errors (vote, save, follow)
4. **Anonymous browsing** — thoughtfully implemented with interception pattern
5. **Comprehensive admin/community management** features
6. **Markdown editor** — full-featured with toolbar, preview, mentions, GIF support

### Critical Action Items
1. **Fix `onPostDeleted` undo logic** (reverse the confirm/undo semantics)
2. **Fix DM navigation** from profile page (username → conversation ID)
3. **Replace hardcoded `/api/` URLs** with `environment.apiUrl`
4. **Implement comment report/save/follow** backend endpoints or remove UI
5. **Refactor `CommunityDetailComponent`** — split into smaller focused components

### Recommended Improvements
- Extract shared vote/save logic into a composable or mixin
- Add global loading interceptor
- Add WebSocket reconnection logic for notifications
- Implement DM real-time messaging via STOMP
- Add debounce to mention search
- Differentiate toast styles for success/error
- Add cache layer or simple state store for frequently accessed data
