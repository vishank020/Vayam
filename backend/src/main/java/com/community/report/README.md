# Report Module

Allows authenticated users to report other users. Reports are stored in the `reports` table.

## Endpoints
- `POST /api/users/{id}/report` — Report a user (authenticated, 200)
  - Body: `{"reason": "Spam"}`
  - `reason` is `@NotBlank @Size(max=1000)`

## Key behaviors
- Cannot report yourself (400)
- No duplicate checking — multiple reports allowed
- No notification to reported user
