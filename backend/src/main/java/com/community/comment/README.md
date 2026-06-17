# Comment Module

Handles comments nested under posts, with anonymous author handling and `isAuthor` detection.

## Key Classes

- `CommentController` — REST endpoints for `/api/posts/{postId}/comments/*`
- `CommentService` — Business logic for CRUD, anonymous handling, notification creation
- `Comment` — JPA entity mapping to `comments` table
- `CommentResponse` — Record with `isAuthor` boolean (per-request)
- `CreateCommentRequest` — Record with `content` field

## Anonymous Comments

- Comments inherit `is_anonymous` from the parent post (if the post is anonymous and the commenter is not the post author, the comment is marked anonymous)
- Anonymous comments return `null` author fields for non-author viewers
- `isAuthor` field returned per-request: true if the viewer is the comment author OR the post author

## Notifications

- Creating a comment on someone else's post triggers a `COMMENT` notification to the post author
- The post author is excluded from receiving their own comment notification

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/posts/{postId}/comments` | Required | Create comment |
| GET | `/api/posts/{postId}/comments` | Public | List comments (paginated) |
| DELETE | `/api/posts/{postId}/comments/{commentId}` | Required | Delete comment (author or post author only) |
