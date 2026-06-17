# User Module

Manages user profiles, avatars, public keys for E2EE, and social graph (follows).

## Key Classes

- `UserController` — REST endpoints for `/api/users/*`
- `FollowController` — REST endpoints for `/api/users/*` follow operations
- `UserService` — Business logic for profile CRUD
- `FollowService` — Business logic for follow/unfollow
- `User` — JPA entity mapping to `users` table
- `UserProfile` — JPA entity mapping to `user_profiles` table (separates display data from auth)
- `UserRepository` — Spring Data JPA repository

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/me` | Required | Get current user's profile |
| PUT | `/api/users/me` | Required | Update display name, bio, avatar |
| PUT | `/api/users/me/public-key` | Required | Update E2EE public key |
| GET | `/api/users/{id}` | Public | Get any user's public profile |
| GET | `/api/users/by-username/{username}` | Public | Lookup by username |
| GET | `/api/users/{id}/public-key` | Public | Get user's E2EE public key |
| POST | `/api/users/{id}/follow` | Required | Follow a user |
| DELETE | `/api/users/{id}/follow` | Required | Unfollow a user |
| GET | `/api/users/{id}/followers` | Public | Paginated follower list |
| GET | `/api/users/{id}/following` | Public | Paginated following list |
| GET | `/api/users/{id}/follow-counts` | Public | Follower/following counts |
| GET | `/api/users/{id}/is-following` | Public | Check if current user follows |

## Notes

- Email is stored as SHA-256 hash only; never in plaintext
- Public key is stored for E2EE DM functionality (Phase 5)
- `UserResponse` includes `followerCount`, `followingCount`, and `isFollowing` (null when unauthenticated)
- `GET /api/users/by-username/{username}` → `UserResponse` now returns `followerCount`, `followingCount`, `isFollowing` (null when unauthenticated)
- Principal extracted from `SecurityContextHolder` directly (endpoint is `permitAll`)
- `UserService.getProfileByUsername(String username, Optional<UUID> requestingUserId)` computes follow counts and `isFollowing`
