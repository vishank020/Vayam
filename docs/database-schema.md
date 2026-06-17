# Database Schema — Quick Reference

See [DATABASE.md](DATABASE.md) for the full ERD with all fields.

## Tables

| Table | Purpose | Key FKs |
|-------|---------|---------|
| `users` | Auth + profile | — |
| `user_profiles` | Display data separated from auth | `user_id → users` |
| `communities` | Community groups | `owner_id → users` |
| `community_members` | Membership + roles | `community_id → communities`, `user_id → users` |
| `community_invites` | Invite tracking | `community_id → communities`, `inviter_id/invitee_id → users` |
| `posts` | All post types | `user_id → users`, `community_id → communities` |
| `post_anonymous_map` | Anonymous post → author mapping | `post_id → posts`, `user_id → users` |
| `comments` | Nested under posts | `post_id → posts`, `user_id → users` |
| `follows` | Social graph | `follower_id/followed_id → users` |
| `notifications` | Activity notifications | `user_id → users` |
| `questions` | Q&A questions | `author_id → users` |
| `answers` | Q&A answers | `question_id → questions`, `author_id → users` |
| `anonymous_identities` | (Future) Anonymous session tokens | — |
| `blocks` | One-directional block system | `blocker_id/blocked_id → users` |
| `reports` | User-submitted reports | `reporter_id/reported_user_id → users` |

## Enums (PostgreSQL native)

- `post_type: GENERAL | ACHIEVEMENT | PROJECT | JOB`
- `notification_type: FOLLOW | COMMENT | LIKE | MENTION`

Both have implicit VARCHAR→enum casts (V9, V13).
