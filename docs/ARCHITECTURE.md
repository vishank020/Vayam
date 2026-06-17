# Architecture

## System Context

```
[Angular SPA :4200]
     │
     ├── REST (HTTP) ──────→ [Spring Boot API :8080] ──JPA──→ [PostgreSQL 16 :5434]
     │                              │                               + pgcrypto
     └── WebSocket (STOMP) ──→ [WebSocket Handler]
                                     │
                              /user/queue/notifications
```

## Backend Module Dependencies

```
auth ──→ user ──→ community ──→ post ──→ comment ──→ notification
  │       │         │             │
  │       │         └── follow    ├── qna
  │       │                       └── post_anonymous_map
  │       └── storage
  └── anon (scaffold)
```

- `auth` — standalone JWT filter, register/login/logout
- `user` — profile CRUD, public keys, depends on auth
- `community` — CRUD + members + invites + roles
- `post` — CRUD + feeds + anonymous posting, depends on community
- `comment` — nested under posts, depends on post
- `follow` — social graph, depends on user
- `notification` — triggered by follow/comment/like/mention, depends on all social modules
- `qna` — questions + answers
- `storage` — MinIO upload/download, standalone

## Frontend Module Dependencies

```
core/ ──── auth guard, HTTP interceptor, WebSocket, services
  │
  ├── auth/          login, register
  ├── profile/       view/edit profile, follow counts
  ├── feed/          paginated global post feed
  ├── post/          detail, create, edit (with anonymous toggle)
  ├── communities/   list, detail, create, join/leave, invites
  ├── qna/           ask question, question list, detail
  ├── comment/       embeddable comment list + form
  ├── notification/  bell icon + dropdown + real-time
  └── app-header/    sticky nav with Feed/Q&A/Communities/notification/user menu
```

## Data Flow — Post Creation with Anonymous Toggle

```
User → CreatePostComponent
  → POST /api/posts
  → { title, content, postType, communityId, isAnonymous }
  → JWT filter validates access_token cookie
  → PostService.createPost()
    → Save Post with is_anonymous flag
    → If isAnonymous: create post_anonymous_map row (user_id → post_id)
    → Return PostResponse (anonymized if !isAuthor)
```

### Edit with Anonymous Toggle

```
User → EditPostComponent
  → PUT /api/posts/{id}
  → { ..., isAnonymous: true }   // toggled from false
  → PostService.updatePost()
    → Update title, content, type
    → Set is_anonymous flag
    → If wasAnonymous && !isAnonymous: DELETE post_anonymous_map
    → If !wasAnonymous && isAnonymous: CREATE post_anonymous_map
    → Set updatedAt = Instant.now()
```

## Data Flow — Real-time Notifications

```
User A follows User B
  → FollowService.createNotification()
  → Notification saved to DB
  → WebSocket message to /user/queue/notifications for User B
  → Frontend NotificationBellComponent receives update
  → Badge count increments
```
