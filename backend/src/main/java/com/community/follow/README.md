# Follow Module

Manages the social graph — follow/unfollow users, list followers/following, counts.

## Key Classes

- `FollowController` — REST endpoints for `/api/users/*` follow operations
- `FollowService` — Business logic for follow, unfollow, queries
- `Follow` — JPA entity mapping to `follows` table
- `FollowRepository` — Spring Data JPA with follower/following count queries
- `FollowResponse` — Record with user profile info
- `FollowCountResponse` — Record with `followersCount` and `followingCount`

## Rules

- Users cannot follow themselves (server-side check returns 400)
- Follow is idempotent — duplicate follow returns success
- Unfollow on a non-existent follow relationship returns success
- Follow counts show total count regardless of auth state
- Follow is blocked if the target user has blocked the follower → returns 400 "Cannot follow this user"

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users/{userId}/follow` | Required | Follow a user |
| DELETE | `/api/users/{userId}/follow` | Required | Unfollow a user |
| GET | `/api/users/{userId}/followers` | Public | Paginated follower list |
| GET | `/api/users/{userId}/following` | Public | Paginated following list |
| GET | `/api/users/{userId}/follow-counts` | Public | Follower/following counts |
| GET | `/api/users/{userId}/is-following` | Public | Check if current user follows (returns false if unauthenticated) |
