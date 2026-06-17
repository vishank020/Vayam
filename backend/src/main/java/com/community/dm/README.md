# DM Module

Direct messaging via REST + WebSocket (STOMP). Messages are stored as plaintext; E2EE encryption (Web Crypto API) is planned.

## Database

- `conversations` — id, created_at
- `conversation_participants` — conversation_id, user_id, UNIQUE constraint
- `messages` — conversation_id, sender_id, body (TEXT), sent_at, read_at (nullable)
- Migration: `V14__create_conversations_and_messages.sql`

## Key Classes

- `Conversation` — JPA entity for conversations
- `ConversationParticipant` — Many-to-many join entity
- `Message` — JPA entity with raw UUID FKs
- `ConversationService` — Create, list, get messages, send message
- `ConversationController` — REST endpoints + `@MessageMapping` for WebSocket
- `ConversationRepository` — Custom JPQL for finding existing conversations

## REST Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/conversations` | Required | Create conversation with participant IDs |
| GET | `/api/conversations` | Required | List user's conversations (sorted by last message) |
| GET | `/api/conversations/{id}/messages` | Required | Paginated message history (participant only) |
| POST | `/api/conversations/{id}/messages` | Required | Send a message |

## WebSocket Events

- `Send` — `/app/chat.sendMessage` with `{conversationId, body}` JSON payload
- `Subscribe` — `/topic/chat/{conversationId}` — Receive real-time messages

## Frontend

- `DmService` — REST client for conversations + messages
- `DmListComponent` — `/dm` — conversation list, search user to start chat
- `DmChatComponent` — `/dm/:id` — message history + send form
- Both guarded by `authGuard`
