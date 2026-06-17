# Notification Module

Manages user notifications for social interactions and provides real-time delivery via WebSocket.

## Notification Types

| Type | Trigger |
|------|---------|
| `FOLLOW` | A user follows another user |
| `COMMENT` | A user comments on a post |
| `LIKE` | (Future) A user likes a post |
| `MENTION` | (Future) A user is mentioned in a post/comment |

## Key Classes

- `NotificationController` — REST endpoints for `/api/notifications/*`
- `NotificationService` — Business logic for create, list, mark read, unread count
- `Notification` — JPA entity mapping to `notifications` table
- `NotificationRepository` — Spring Data JPA with unread count queries
- `NotificationResponse` — Record with notification details
- `NotificationWebSocketHandler` — Sends real-time notifications via STOMP (`/user/queue/notifications`)

## Real-time Delivery

- Frontend subscribes to `/user/queue/notifications` via STOMP over WebSocket
- When a notification is created, the server publishes to the recipient's user queue
- Frontend `WebSocketService` updates the unread count live

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications` | Required | List notifications (paginated) |
| GET | `/api/notifications/unread-count` | Required | Get unread count |
| PUT | `/api/notifications/{id}/read` | Required | Mark notification as read |
| PUT | `/api/notifications/read-all` | Required | Mark all as read |
