# Auth Module

Handles user registration, login, JWT issuance/refresh, and cookie-based authentication.

## Key Classes

- `AuthController` — REST endpoints for `/api/auth/*`
- `AuthService` — Register, login, refresh business logic
- `JwtTokenProvider` — JWT generation and validation (HS256, access + refresh)
- `JwtAuthenticationFilter` — OncePerRequestFilter that reads JWT from `access_token` cookie or `Authorization: Bearer` header
- `AuthPrincipal` — Custom `UserDetails` implementation extracted from JWT claims

## Auth Flow

1. **Register** — `POST /api/auth/register` → creates User + UserProfile → sets HttpOnly cookies
2. **Login** — `POST /api/auth/login` → validates credentials → sets HttpOnly cookies
3. **Refresh** — `POST /api/auth/refresh` → validates refresh token from cookie or body → issues new tokens
4. **Check** — `GET /api/auth/me` → reads `access_token` cookie → returns `UserResponse` (or 401)
5. **Logout** — `POST /api/auth/logout` → clears both cookies via `Max-Age=0`

## Cookie Configuration

| Cookie | Path | Max-Age | HttpOnly | SameSite |
|--------|------|---------|----------|----------|
| `access_token` | `/` | 900s (15m) | true | Strict |
| `refresh_token` | `/api/auth` | 604800s (7d) | true | Strict |

Both `Authorization: Bearer <token>` header and cookies are accepted for API client compatibility.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/refresh` | Public | Refresh tokens |
| GET | `/api/auth/me` | Public | Get current user (returns 401 if unauthenticated) |
| POST | `/api/auth/logout` | Public | Clear auth cookies |
