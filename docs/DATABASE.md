# Database Schema

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ user_profiles : has
    users ||--o{ community_members : has
    users ||--o{ community_invites : sends
    users ||--o{ posts : authors
    users ||--o{ comments : writes
    users ||--o{ follows : follows
    users ||--o{ notifications : receives
    users ||--o{ questions : asks
    users ||--o{ answers : writes
    users ||--o{ post_anonymous_map : "maps to"
    users ||--o{ blocks : blocks
    users ||--o{ reports : reports
    users ||--o{ post_saves : saves
    users ||--|| user_settings : has
    users ||--o{ mutes : mutes

    communities ||--o{ community_members : contains
    communities ||--o{ community_invites : has
    communities ||--o{ posts : contains

    posts ||--o{ comments : has
    posts ||--o{ post_anonymous_map : "has (if anonymous)"
    posts ||--o{ post_saves : saved

    questions ||--o{ answers : has

    users ||--o{ conversation_participants : joins
    users ||--o{ messages : sends
    users ||--o{ projects : creates
    conversations ||--o{ conversation_participants : has
    conversations ||--o{ messages : contains

    users {
        uuid id PK
        varchar username UK
        varchar email_hash UK
        varchar password_hash
        varchar display_name
        text bio
        varchar avatar_url
        text public_key
        varchar role "USER | MOD | ADMIN"
        varchar totp_secret
        boolean is_totp_enabled
        timestamp created_at
        timestamp updated_at
    }

    user_profiles {
        uuid id PK
        uuid user_id FK UK "one-to-one"
        varchar display_name
        text bio
        varchar avatar_url
        varchar cover_url
        text public_key
        varchar website
        varchar location
        timestamp created_at
        timestamp updated_at
    }

    communities {
        uuid id PK
        varchar name "unique"
        text description
        varchar visibility "PUBLIC | PRIVATE"
        uuid owner_id FK
        timestamp created_at
        timestamp updated_at
    }

    community_members {
        uuid id PK
        uuid community_id FK
        uuid user_id FK
        varchar role "OWNER | MOD | MEMBER"
        timestamp joined_at
    }

    community_invites {
        uuid id PK
        uuid community_id FK
        uuid inviter_id FK
        uuid invitee_id FK
        varchar status "PENDING | ACCEPTED | DECLINED | EXPIRED"
        timestamp created_at
    }

    posts {
        uuid id PK
        varchar title
        text content
        varchar post_type "GENERAL | ACHIEVEMENT | PROJECT | JOB"
        uuid user_id FK
        uuid community_id FK "nullable"
        boolean is_anonymous
        timestamp created_at
        timestamp updated_at
    }

    post_anonymous_map {
        uuid post_id PK FK "NEVER joined in public queries"
        uuid user_id FK
        timestamp created_at
    }

    comments {
        uuid id PK
        uuid post_id FK
        uuid user_id FK
        text content
        boolean is_anonymous
        timestamp created_at
        timestamp updated_at
    }

    follows {
        uuid id PK
        uuid follower_id FK "the user who follows"
        uuid followed_id FK "the user being followed"
        timestamp created_at
    }

    notifications {
        uuid id PK
        uuid user_id FK "recipient"
        varchar notification_type "FOLLOW | COMMENT | LIKE | MENTION"
        uuid reference_id
        varchar reference_type
        text message
        boolean is_read
        timestamp created_at
    }

    questions {
        uuid id PK
        varchar title
        text content
        uuid author_id FK
        timestamp created_at
        timestamp updated_at
    }

    answers {
        uuid id PK
        uuid question_id FK
        uuid author_id FK
        text content
        boolean is_correct
        timestamp created_at
        timestamp updated_at
    }

    blocks {
        uuid id PK
        uuid blocker_id FK
        uuid blocked_id FK
        timestamp created_at
    }

    reports {
        uuid id PK
        uuid reporter_id FK
        uuid reported_user_id FK
        varchar reason "max 1000 chars"
        timestamp created_at
    }

    conversations {
        uuid id PK
        timestamp created_at
    }

    conversation_participants {
        uuid id PK
        uuid conversation_id FK
        uuid user_id FK
    }

    messages {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        text body
        timestamp sent_at
        timestamp read_at
    }

    projects {
        uuid id PK
        uuid user_id FK
        varchar title
        text description
        varchar tech_stack
        varchar repo_url
        varchar live_url
        date start_date
        date end_date
        timestamp created_at
        timestamp updated_at
    }

    post_saves {
        uuid user_id PK FK
        uuid post_id PK FK
        timestamp created_at
    }

    user_settings {
        uuid id PK
        uuid user_id FK UK
        varchar theme "system | light | dark"
        varchar accent_color
        boolean notify_comments
        boolean notify_replies
        boolean notify_mentions
        boolean notify_follows
        boolean notify_system
        boolean show_email
        boolean show_website
        boolean show_location
        boolean allow_discovery
        boolean allow_follow_requests
        timestamp updated_at
    }

    mutes {
        uuid id PK
        uuid user_id FK
        uuid muted_user_id FK
        timestamp created_at
    }
```

## Key Design Decisions

### Email Storage
Emails stored as SHA-256 hashes only. Raw email never persisted. Allows uniqueness checks + lookup during registration while keeping emails private.

### Anonymous Post Isolation
`post_anonymous_map` is a separate table with **no FK relationship exposed in public queries**. The backend explicitly avoids joining this table in feed/detail queries. Only the service layer accesses it for:
- Creating the map on anonymous post creation
- Deleting the map on anonymous→non-anonymous toggle during edit
- Moderation (future)

### PostgreSQL Enums
`post_type` and `notification_type` use native PostgreSQL enums. Hibernate sends VARCHAR via `@Enumerated(EnumType.STRING)`, so implicit VARCHAR→enum casts are added:
- V9: `CREATE CAST (varchar AS post_type) WITH INOUT AS IMPLICIT`
- V13: `CREATE CAST (varchar AS notification_type) WITH INOUT AS IMPLICIT`

### Timestamps
All tables use `created_at` and `updated_at` with the `update_updated_at_column()` trigger function (created in V1).

---

## Migrations

| File | Description |
|------|-------------|
| V1 | `users` table, pgcrypto extension, `update_updated_at_column()` function |
| V2 | `anonymous_identities` table (future use) |
| V3 | `user_profiles` table (separates auth from display data) |
| V4 | `communities`, `community_members`, `community_invites` |
| V5 | `questions`, `answers` |
| V6 | Drops profile columns from `users` to `user_profiles` |
| V7 | `posts` table with `post_type` enum, FKs, trigger |
| V8 | `post_anonymous_map` (FK to posts, never joined in public queries) |
| V9 | Implicit VARCHAR→`post_type` enum cast |
| V10 | `comments` table |
| V11 | `follows` table with UNIQUE constraint |
| V12 | `notifications` table with `notification_type` enum |
| V13 | Implicit VARCHAR→`notification_type` enum cast |
| V14 | `conversations`, `conversation_participants`, `messages` |
| V15 | `blocks` table with UNIQUE constraint, CHECK no-self-block, indexes |
| V16 | `reports` table with `reported_user_id`, VARCHAR(1000) reason, index |
| V17 | `projects` table for user portfolio features |
| V18 | `search_indexes` with GIN indexing for full-text search across posts, communities, users |
| V19 | `comment_votes` (user_id, comment_id junction, vote_value) |
| V20 | Add `actor_username` column to `notifications` |
| V21 | `post_votes` (user_id, post_id junction, vote_value) |
| V22 | Add `media_urls` to `posts` (`TEXT[]` array column) |
| V23 | Add `parent_id` (nested comments) to `comments` |
| V24 | Replace `actor_username` with `actor_id` UUID FK in `notifications` |
| V25 | `user_profiles` Add `website` and `location` columns |
| V26 | `post_saves` table for saving posts |
| V27 | `user_settings` table for user preferences and privacy |
| V28 | Add community rules, join requests, and invite links support |
| V29 | Add `cover_url` to `user_profiles` |
| V30 | Add `community_bans` |
| V31 | Add `invite_notification_type` |
| V32 | Add `moderation_log` |
| V33 | Add scheduled posts and pinning columns to `posts` |
| V34 | Add `totp_secret` and `is_totp_enabled` columns to `users` |
| V35 | `mutes` table (user_id, muted_user_id junction) |
| V36 | Add `accent_color` column to `user_settings` |
