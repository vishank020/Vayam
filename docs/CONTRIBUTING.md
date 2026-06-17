# Contributing

## Branch Naming

- `feature/description` — New features
- `bugfix/description` — Bug fixes
- `refactor/description` — Code refactoring
- `docs/description` — Documentation updates

## Commit Style

Use conventional commits:

- `feat: add user profile endpoint`
- `fix: correct JWT expiration check`
- `docs: update auth flow diagram`
- `refactor: extract post validation logic`
- `test: add community service tests`

## PR Checklist

- [ ] Code compiles (`mvnw package` + `ng build`)
- [ ] Module README updated if behavior changed
- [ ] `docs/API.md` updated for new/updated endpoints
- [ ] `docs/DATABASE.md` updated for new migrations
- [ ] `AGENTS.md` updated for new conventions
- [ ] Migration added for new DB changes

## Code Style

- **Java**: Google Java Style
- **TypeScript**: Prettier defaults (120 char width)
- **SQL**: UPPERCASE keywords, snake_case identifiers

## Documentation Model

Docs are updated alongside code changes — never after. Each code change should include:

1. `docs/API.md` — if API endpoints changed
2. `docs/DATABASE.md` — if migrations/schema changed
3. `docs/AUTH.md` — if auth flow changed
4. Backend module `README.md` — if module behavior changed
5. `AGENTS.md` — if conventions/commands/routes changed
