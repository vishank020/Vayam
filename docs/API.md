# API Reference

Base URL: `http://localhost:8080/api`

**Auth**: JWT tokens in HttpOnly cookies (`access_token` + `refresh_token`).  
The frontend never reads tokens — every request includes `credentials: 'include'` / `withCredentials: true`.  
`Authorization: Bearer <token>` header is also accepted for API clients.

---

## Authentication

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePass123",
  "displayName": "John Doe"
}

Response 200 (Set-Cookie: access_token, refresh_token):
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "role": "USER"
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securePass123"
}

Response 200 (Set-Cookie: access_token, refresh_token):
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "role": "USER"
}
```
Note: Login uses `username` (not email).

### Refresh Token
```
POST /api/auth/refresh
Content-Type: application/json

// Reads refresh_token from cookie OR request body:
{ "refreshToken": "eyJhbGci..." }

Response 200 (Set-Cookie: new access_token, refresh_token):
{
  "userId": "...", "username": "...", "role": "USER"
}
```

### Get Current User
```
GET /api/auth/me
Cookie: access_token=...

Response 200:
{
  "id": "550e8400-...",
  "username": "johndoe",
  "displayName": "John Doe",
  "bio": "Full-stack developer",
  "avatarUrl": "https://cdn.example.com/avatar.jpg",
  "publicKey": "-----BEGIN PUBLIC KEY-----...",
  "role": "USER",
  "followerCount": 5,
  "followingCount": 12,
  "createdAt": "2026-01-15T10:30:00Z"
}

Response 401: (no auth)
```

### Logout
```
POST /api/auth/logout
Response 200 (Set-Cookie: access_token=; Max-Age=0, refresh_token=; Max-Age=0)
```

### Change Password
```
PUT /api/auth/password
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword123"
}
Response 200
```

### Generate 2FA Secret
```
GET /api/auth/2fa/generate
Response 200:
{
  "qrCodeImage": "data:image/png;base64,...",
  "secret": "JBSWY3DPEHPK3PXP"
}
```

### Enable 2FA
```
POST /api/auth/2fa/enable
Content-Type: application/json

{
  "secret": "JBSWY3DPEHPK3PXP",
  "code": "123456"
}
Response 200
```

### Disable 2FA
```
POST /api/auth/2fa/disable
Content-Type: application/json

{
  "code": "123456"
}
Response 200
```

### Verify Login 2FA
Verify the authenticator code during the login flow to establish a session:
```
POST /api/auth/login/verify
Content-Type: application/json

{
  "code": "123456",
  "tempToken": "eyJhbGci..."
}
Response 200 (Set-Cookie: access_token, refresh_token): AuthResponse
```

---

## Users

### Get My Profile
```
GET /api/users/me
Response 200: UserResponse (same shape as /api/auth/me)
```

### Update My Profile
```
PUT /api/users/me
{
  "displayName": "John Updated",
  "bio": "Senior developer",
  "avatarUrl": "https://cdn.example.com/avatars/new.jpg"
}
Response 200: UserResponse
```

### Delete My Avatar
```
DELETE /api/users/me/avatar
Response 200: UserResponse
```

### Get User Settings
```
GET /api/settings
Cookie: access_token=...
Response 200: UserSettingsResponse (theme, notifications, privacy)
```

### Update User Settings
```
PUT /api/settings
Cookie: access_token=...
{
  "theme": "dark",
  "notifyComments": true,
  "showEmail": false
  // ...
}
Response 200: UserSettingsResponse
```

### Update Public Key (E2EE)
```
PUT /api/users/me/public-key
{ "publicKey": "-----BEGIN PUBLIC KEY-----..." }
Response 200
```

### Get User by ID
```
GET /api/users/{id}
Response 200: UserResponse
```

### Get User by Username
```
GET /api/users/by-username/{username}
Response 200: {
  "id": "...",
  "username": "johndoe",
  "displayName": "John Doe",
  "bio": "Developer",
  "avatarUrl": "...",
  "followerCount": 5,
  "followingCount": 12,
  "isFollowing": true    // null if unauthenticated
}
```

### Get User Public Key
```
GET /api/users/{id}/public-key
Response 200: { "publicKey": "-----BEGIN PUBLIC KEY-----..." }
```

### Follow User
```
POST /api/users/{userId}/follow
Response 201 CREATED
```

### Unfollow User
```
DELETE /api/users/{userId}/follow
Response 204 NO CONTENT
```

### Get Followers
```
GET /api/users/{userId}/followers?page=0&size=20
Response 200: Page<FollowResponse>
```

### Get Following
```
GET /api/users/{userId}/following?page=0&size=20
Response 200: Page<FollowResponse>
```

### Get Follow Counts
```
GET /api/users/{userId}/follow-counts
Response 200: { "followersCount": 5, "followingCount": 12 }
```

### Check If Following
```
GET /api/users/{userId}/is-following
Response 200: { "isFollowing": true }
```

### Block User
```
POST /api/users/{id}/block
Cookie: access_token=...
Response 200
```
Idempotent — returns 200 even if already blocked.

### Unblock User
```
DELETE /api/users/{id}/block
Cookie: access_token=...
Response 200
```
Idempotent — returns 200 even if not blocked.

### Mute User
```
POST /api/users/{id}/mute
Cookie: access_token=...
Response 200
```

### Unmute User
```
DELETE /api/users/{id}/mute
Cookie: access_token=...
Response 200
```

### List Blocked Users
```
GET /api/users/me/blocked
Cookie: access_token=...
Response 200: ["uuid-1", "uuid-2"]
```

### Report User
```
POST /api/users/{id}/report
Cookie: access_token=...
Content-Type: application/json

{
  "reason": "Spam"
}

Response 200
```
`reason` is `@NotBlank @Size(max=1000)`. Cannot report yourself (400).

---

## Communities

All community endpoints are public (`permitAll`). Auth handled optionally via cookie.

### Create Community
```
POST /api/communities
{
  "name": "My Community",
  "description": "A cool community",
  "visibility": "PUBLIC"   // or "PRIVATE"
}
Response 201 CREATED: CommunityResponse
```

### List Communities
```
GET /api/communities?page=0&size=20
Response 200: Page<CommunityResponse>
```

### Get Community
```
GET /api/communities/{id}
Response 200: CommunityResponse
```

### Update Community
```
PUT /api/communities/{id}
{ "name": "...", "description": "...", "visibility": "PUBLIC" }
Response 200: CommunityResponse
```

### Delete Community
```
DELETE /api/communities/{id}
Response 204 NO CONTENT
```

### Join Community
```
POST /api/communities/{id}/join
Response 200
```

### Leave Community
```
POST /api/communities/{id}/leave
Response 200
```

### Invite User
```
POST /api/communities/{id}/invite
{ "userId": "550e8400-..." }
Response 201 CREATED: InviteResponse
```

### Accept Invite
```
POST /api/communities/{id}/invites/{inviteId}/accept
Response 200
```

### Decline Invite
```
POST /api/communities/{id}/invites/{inviteId}/decline
Response 200
```

### Get Members
```
GET /api/communities/{id}/members
Response 200: [CommunityMemberResponse]
```

### Get Invites (for a community)
```
GET /api/communities/{id}/invites
Response 200: [InviteResponse]
```

### Get My Communities
```
GET /api/communities/my
Response 200: [CommunityResponse]
```

### Get My Invites
```
GET /api/communities/invites
Response 200: [InviteResponse]
```

---

## Posts

### Create Post
```
POST /api/posts
{
  "title": "My Post",
  "content": "Post content here",
  "postType": "GENERAL",        // GENERAL | ACHIEVEMENT | PROJECT | JOB
  "communityId": null,           // or UUID for community-scoped post
  "isAnonymous": false
}
Response 201 CREATED: PostResponse
```

### Get Feed (Global)
```
GET /api/posts?page=0&size=20
Response 200: Page<FeedPostResponse>
```
Public endpoint — no auth required.

### Get Community Feed
```
GET /api/posts/communities/{communityId}/posts?page=0&size=20
Response 200: Page<FeedPostResponse>
```

### Get User Posts
```
GET /api/posts/user/{userId}?page=0&size=20
Response 200: Page<FeedPostResponse>
```

### Get User Comments (as Feed Posts)
```
GET /api/posts/{postId}/comments/user/{userId}?page=0&size=20
Response 200: Page<FeedPostResponse>
```

### Get Saved Posts
```
GET /api/posts/saved?page=0&size=20
Cookie: access_token=...
Response 200: Page<FeedPostResponse>
```

### Save Post
```
POST /api/posts/{id}/save
Cookie: access_token=...
Response 200
```

### Unsave Post
```
DELETE /api/posts/{id}/save
Cookie: access_token=...
Response 200
```

### Get Upvoted Posts
```
GET /api/posts/upvoted?page=0&size=20
Cookie: access_token=...
Response 200: Page<FeedPostResponse>
```

### Get Post Detail
```
GET /api/posts/{id}
Response 200: PostResponse
```
If the post is anonymous and the viewer is not the author, `authorId`, `authorUsername`, `authorDisplayName`, `authorAvatarUrl` are `null`.

### Update Post
```
PUT /api/posts/{id}
{
  "title": "Updated Title",
  "content": "Updated content",
  "postType": "GENERAL",
  "communityId": null,
  "isAnonymous": true     // toggle anonymous on/off
}
Response 200: PostResponse
```
Only the author can update. Anonymous toggle creates/deletes `post_anonymous_map` row.

### Delete Post
```
DELETE /api/posts/{id}
Response 204 NO CONTENT
```

---

## Comments

### Create Comment
```
POST /api/posts/{postId}/comments
{ "content": "Great post!" }
Response 201 CREATED: CommentResponse
```
`isAuthor` field indicates if the requesting user authored the comment or the parent post.

### Get Comments
```
GET /api/posts/{postId}/comments?page=0&size=20
Response 200: Page<CommentResponse>
```
Public endpoint. Anonymous comments hide author details from non-author viewers.

### Delete Comment
```
DELETE /api/posts/{postId}/comments/{commentId}
Response 204 NO CONTENT
```
Only comment author or post author can delete.

---

## Notifications

All notification endpoints require authentication.

### List Notifications
```
GET /api/notifications?page=0&size=20
Response 200: Page<NotificationResponse>
```

### Unread Count
```
GET /api/notifications/unread-count
Response 200: { "count": 3 }
```

### Mark as Read
```
PUT /api/notifications/{id}/read
Response 200
```

### Mark All as Read
```
PUT /api/notifications/read-all
Response 200
```

---

## Q&A

### Ask Question
```
POST /api/questions
{ "title": "...", "content": "..." }
Response 201 CREATED
```

### List Questions
```
GET /api/questions?page=0&size=20
Response 200: Page<QuestionResponse>
```

### Get Question Detail
```
GET /api/questions/{id}
Response 200: QuestionResponse
```

### Post Answer
```
POST /api/questions/{id}/answers
{ "content": "..." }
Response 201 CREATED
```

### Delete Answer
```
DELETE /api/questions/{questionId}/answers/{answerId}
Response 204
```

---

## Storage (MinIO)

### Upload File
```
POST /api/storage/upload
Content-Type: multipart/form-data

file: <binary>
prefix: "feed"          // optional path prefix

Response 200: { "objectName": "feed/uuid-filename.jpg" }
```

### Get Presigned URL
```
GET /api/storage/url/{objectName}
Response 200: { "url": "https://minio.example.com/..." }
```

### Delete File
```
DELETE /api/storage/{objectName}
Response 204
```

---

## WebSocket (STOMP)

### Connection
```
Endpoint: /ws
Protocol: STOMP over WebSocket (native)

Headers: { "Authorization": "Bearer <token>" }
```

### Subscribe
```
/user/queue/notifications    — Real-time notification updates
```

---

## Direct Messaging (DMs)

### List Conversations
```
GET /api/conversations
Response 200: [ConversationResponse]
```

### Get Messages
```
GET /api/conversations/{id}/messages?page=0&size=20
Response 200: Page<MessageResponse>
```

### Send Message (REST fallback)
```
POST /api/conversations/{id}/messages
{ "body": "Hello!" }
Response 201 CREATED
```

---

## Projects

### List My Projects
```
GET /api/users/me/projects
Response 200: [ProjectResponse]
```

### Create Project
```
POST /api/users/me/projects
{
  "title": "Vayam",
  "description": "A social network",
  "techStack": "Spring Boot, Angular",
  "repoUrl": "https://github.com/...",
  "liveUrl": "https://...",
  "startDate": "2026-01-01",
  "endDate": "2026-06-01"
}
Response 201 CREATED
```

### List User Projects
```
GET /api/users/{userId}/projects
Response 200: [ProjectResponse]
```

---

## Search

### Global Search
```
GET /api/search?q={query}
Response 200: SearchResultResponse (contains posts, users, communities)
```

---

## Error Response

All errors follow this shape:
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Human-readable error description",
  "timestamp": "2026-06-15T10:30:00Z"
}
```
