# Block Module

One-directional block system. Blocker never sees blocked user's posts in the global feed. Blocked user cannot follow the blocker.

## Endpoints
- `POST /api/users/{id}/block` — Block a user (idempotent, 200)
- `DELETE /api/users/{id}/block` — Unblock a user (idempotent, 200)
- `GET /api/users/me/blocked` — List blocked user IDs (authenticated)

## Key behaviors
- `block()` returns silently if already blocked
- `unblock()` returns silently if not blocked
- Feed filtering applies only in `PostService.getFeed()` (global feed, not community feed)
- `FollowService.follow()` checks `isBlocked(targetUserId, followerId)` and rejects with 400
