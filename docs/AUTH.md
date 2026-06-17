# Authentication — JWT HttpOnly Cookie Flow

## Design

JWT tokens are stored in **HttpOnly cookies** (`access_token` + `refresh_token`). The frontend never reads or stores tokens in JavaScript. This prevents XSS-based token theft.

- **Access token**: 15 minute expiry, set on `/`, sent on every request
- **Refresh token**: 7 day expiry, set on `/api/auth`, used by `/api/auth/refresh`
- `Authorization: Bearer <token>` header is also accepted for non-browser API clients

## Registration Flow

```
Client (Browser)                Server
  │                               │
  │  POST /api/auth/register     │
  │  {username, email, pass}     │
  │─────────────────────────────→│
  │                               │── Validate input
  │                               │── Check username/email uniqueness
  │                               │── Hash email (SHA-256)
  │                               │── Hash password (BCrypt)
  │                               │── Save User + UserProfile entities
  │                               │── Generate access + refresh JWT
  │  Set-Cookie: access_token     │
  │  Set-Cookie: refresh_token    │
  │  {userId, username, role}     │
  │←─────────────────────────────│
```

## Login Flow

```
Client (Browser)                Server
  │                               │
  │  POST /api/auth/login        │
  │  {username, password}         │
  │─────────────────────────────→│
  │                               │── Lookup user by username
  │                               │── Verify BCrypt password hash
  │                               │── Generate access + refresh JWT
  │  Set-Cookie: access_token     │
  │  Set-Cookie: refresh_token    │
  │  {userId, username, role}     │
  │←─────────────────────────────│
```

## Auth State Check

```
Client (Browser)                Server
  │                               │
  │  GET /api/auth/me            │
  │  Cookie: access_token=...     │
  │─────────────────────────────→│
  │                               │── JwtAuthenticationFilter reads
  │                               │   cookie, validates signature
  │                               │── Returns UserResponse
  │  200: {id, username, ...}     │
  │←─────────────────────────────│

  │  GET /api/auth/me            │
  │  (no cookie)                  │
  │─────────────────────────────→│
  │                               │── No auth principal found
  │  401 UNAUTHORIZED             │
  │←─────────────────────────────│
```

## Refresh Flow

```
Client (Browser)                Server
  │                               │
  │  POST /api/auth/refresh      │
  │  Cookie: refresh_token=...    │  (or body: {refreshToken})
  │─────────────────────────────→│
  │                               │── Validate refresh token signature
  │                               │── Issue new access + refresh tokens
  │  Set-Cookie: new access_token │
  │  Set-Cookie: new refresh_token│
  │  200: {userId, username}      │
  │←─────────────────────────────│
```

## Logout Flow

```
Client (Browser)                Server
  │                               │
  │  POST /api/auth/logout       │
  │─────────────────────────────→│
  │                               │── Set both cookies to Max-Age=0
  │  Set-Cookie: access_token=; Max-Age=0  │
  │  Set-Cookie: refresh_token=; Max-Age=0 │
  │  200 OK                       │
  │←─────────────────────────────│
```

## Token Structure

### Access Token
```json
// Header
{ "alg": "HS256", "typ": "JWT" }
// Payload
{
  "sub": "uuid-user-id",
  "username": "johndoe",
  "role": "USER",
  "iat": 1715000000,
  "exp": 1715000900
}
```

### Refresh Token
```json
// Payload
{
  "sub": "uuid-user-id",
  "iat": 1715000000,
  "exp": 1715604800
}
```

## Cookie Configuration

| Cookie | Path | Max-Age | HttpOnly | SameSite |
|--------|------|---------|----------|----------|
| `access_token` | `/` | 900s (15m) | true | Strict |
| `refresh_token` | `/api/auth` | 604800s (7d) | true | Strict |

## Security Notes

- Passwords hashed with BCrypt (Spring Security default, strength 10)
- Emails stored as SHA-256 hash only (never raw)
- No CSRF protection needed — cookies set with `SameSite=Strict`
- No session state on server (stateless JWT)
