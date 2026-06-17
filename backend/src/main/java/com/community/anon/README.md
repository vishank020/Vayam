# Anonymous Module

Manages anonymous sessions and identity for posting and browsing.

## Privacy Guarantees

1. **No link to user accounts** — Anonymous identities have zero FK references to users table
2. **No IP logging** — Anonymous actions are never logged with IP addresses
3. **No deanonymization** — Moderators can delete anonymous posts but cannot discover the author
4. **Session-only** — Anonymous state is tied to a session token, not a persistent account

## How It Works

1. User clicks "Browse Anonymously" or "Post Anonymously"
2. Backend creates an `anonymous_identities` row with a hashed session token and a random alias
3. Frontend stores the raw session token in localStorage
4. All anonymous API calls include the session token in a header
5. The backend looks up the anonymous identity by the token hash

## Key Classes

- `AnonymousController` — REST endpoints for `/api/anonymous/*`
- `AnonymousService` — Session creation, alias generation, validation
- `AnonymousIdentity` — JPA entity

## Alias Generation

Generated using adjective + animal combinations for friendly, non-identifying names.
Examples: "Curious Raven", "Silent Wolf", "Brave Dolphin"
