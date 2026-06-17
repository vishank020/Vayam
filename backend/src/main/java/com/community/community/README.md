# Community Module

Manages public and private communities, memberships, roles, and invites.

## Community Types

- **PUBLIC** — Visible to everyone, anyone can view posts, join by clicking "Join"
- **PRIVATE** — Hidden from non-members, invite-only

## Roles

| Role | Permissions |
|------|-------------|
| OWNER | Full control: delete community, appoint mods, all mod permissions |
| MOD | Moderate posts, manage invites, remove members |
| MEMBER | View (private) or post (public), invite others if allowed |

## Key Classes

- `CommunityController` — REST endpoints for `/api/communities/*`
- `CommunityService` — Business logic for CRUD, membership, invites
- `Community` — JPA entity with `@ManyToOne` for owner
- `CommunityMember` — Join entity with role
- `CommunityInvite` — Invite tracking for private communities
- `CommunityResponse` — Record with `isMember` and `role` fields (per-request)

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/communities` | Required | Create community |
| GET | `/api/communities` | Public | List public communities (paginated) |
| GET | `/api/communities/{id}` | Public | Community details |
| PUT | `/api/communities/{id}` | Required | Update (owner/mod only) |
| DELETE | `/api/communities/{id}` | Required | Delete (owner only) |
| POST | `/api/communities/{id}/join` | Required | Join public community |
| POST | `/api/communities/{id}/leave` | Required | Leave community |
| POST | `/api/communities/{id}/invite` | Required | Invite user |
| POST | `/api/communities/{id}/invites/{inviteId}/accept` | Required | Accept invite |
| POST | `/api/communities/{id}/invites/{inviteId}/decline` | Required | Decline invite |
| GET | `/api/communities/{id}/members` | Public | List members |
| GET | `/api/communities/{id}/invites` | Required | List community invites (mod+) |
| GET | `/api/communities/my` | Required | User's communities |
| GET | `/api/communities/invites` | Required | User's pending invites |
