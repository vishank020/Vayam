# Search Module

Provides global full-text search capabilities across the platform.

## Features

- Uses PostgreSQL GIN (Generalized Inverted Index) and `to_tsvector` for high-performance full-text search.
- Searches across multiple entities: Posts, Communities, Users, and User Profiles.
- Returns unified search results.

## Key Classes

- `SearchController` — REST endpoint for `/api/search`
- `SearchService` — Business logic to query multiple repositories and aggregate results.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/search?q={query}` | Public | Global search returning mixed entity results |

## Database Indexes

Migration `V18__create_search_indexes.sql` creates GIN indexes on:
- `posts` (title, content)
- `communities` (name, description)
- `users` (username)
- `user_profiles` (display_name, bio)
