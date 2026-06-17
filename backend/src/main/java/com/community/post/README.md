# Post Module

Handles post CRUD, global and community-scoped feeds, anonymous posting, and edit with anonymous toggle.

## Post Types

- `GENERAL` — Any topic
- `ACHIEVEMENT` — Personal or team accomplishment
- `PROJECT` — Project showcase or collaboration request
- `JOB` — Job opening or opportunity
- `QUESTION` — A question requiring answers

## Anonymous Posting

- Posts can be created with `isAnonymous: true` in the request body
- Anonymous posts create a row in `post_anonymous_map` (user_id → post_id)
- Public feed/detail endpoints NEVER join `post_anonymous_map` — anonymous viewers see `null` author fields
- Authors viewing their own anonymous posts see their identity

## Edit with Anonymous Toggle

- `PUT /api/posts/{id}` accepts the same `CreatePostRequest` as create
- If `isAnonymous` changes:
  - `false → true`: creates `post_anonymous_map` row
  - `true → false`: deletes `post_anonymous_map` row
- `updatedAt` is set to `Instant.now()` on save
- Frontend shows "Edited" badge + relative edit timestamp when `updatedAt > createdAt + 1s`

## Key Classes

- `PostController` — REST endpoints for `/api/posts/*`
- `PostService` — Business logic for CRUD, feed, anonymous handling
- `Post` — JPA entity mapping to `posts` table
- `PostAnonymousMap` — JPA entity for anonymous post→user mapping
- `PostRepository` — Spring Data JPA with `findGlobalFeed()` JPQL query
- `CreatePostRequest` — Record with title, content, postType, communityId, isAnonymous
- `PostResponse` — Full post detail with author identity (null for anonymous non-author views)
- `FeedPostResponse` — Feed-optimized DTO with createdAt + updatedAt for edited detection

## Block Filtering

- Global feed (`getFeed()`) filters out posts from users the requesting user has blocked — one-directional visibility
- Community feed is NOT affected by block filtering
- Blocked user is never notified about being blocked

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/posts` | Required | Create post |
| GET | `/api/posts` | Public | Global feed (paginated, filtered for blocked users) |
| GET | `/api/posts/communities/{id}/posts` | Public | Community feed (paginated) |
| GET | `/api/posts/{id}` | Public | Post detail |
| PUT | `/api/posts/{id}` | Required | Update post (author only) |
| DELETE | `/api/posts/{id}` | Required | Delete post (author only) |
