# Project Module

Portfolio management — users can showcase projects they've worked on.

## Key Classes

- `ProjectController` — REST endpoints for `/api/users/me/projects/*`
- `ProjectService` — Business logic
- `Project` — JPA entity

## Endpoints

- `GET /api/users/me/projects` — List current user's projects
- `POST /api/users/me/projects` — Add a project
- `PUT /api/users/me/projects/{id}` — Update project
- `DELETE /api/users/me/projects/{id}` — Delete project
- `GET /api/users/{userId}/projects` — View another user's projects

## Project Fields

- title, description, tech_stack (comma-separated or array), repo_url, live_url, start_date, end_date
