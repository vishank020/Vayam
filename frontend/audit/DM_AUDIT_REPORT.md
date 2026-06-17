# DM / Messages Feature Audit Report

**Generated**: 2026-06-17 | **Scope**: Full stack (backend + frontend), static analysis

---

## Backend

### Endpoint Inventory

| Endpoint | Method | Exists | Notes |
|---|---|---|---|
| `/api/conversations` | GET | ✅ | Returns all user's conversations with last message preview |
| `/api/conversations` | POST | ✅ | Create conversation with participant IDs; reuses existing if exact match |
| `/api/conversations/{id}/messages` | GET | ✅ | Paginated messages, sorted `sentAt DESC`, flipped to ASC on frontend |
| `/api/conversations/{id}/messages` | POST | ✅ | Send message (REST), broadcasts via STOMP `/topic/chat/{id}` |
| `/ws` STOMP `/chat.sendMessage` | MESSAGE | ✅ | WebSocket alternative to POST message; same service call |

**Missing endpoints:**
| Missing Endpoint | Impact |
|---|---|
| `DELETE /api/conversations/{id}/messages/{messageId}` | **Cannot delete messages** |
| `PUT /api/conversations/{id}/messages/{messageId}/read` | **Cannot mark messages as read** |
| `PUT /api/conversations/{id}/messages/{messageId}` | **Cannot edit messages** |
| `DELETE /api/conversations/{id}` | **Cannot delete/leave a conversation** |
| `GET /api/conversations/{id}/participants` | **Cannot list participants** |
| `POST /api/conversations/{id}/typing` | **Cannot send typing indicators** |

### Controller (`ConversationController.java:81`)

- ✅ Clean REST mapping with STOMP WebSocket integration
- ✅ `SimpMessagingTemplate` broadcasts new messages to all participants
- ✅ Reuses existing conversation if exact participant set already exists
- ⚠️ `@MessageMapping("/chat.sendMessage")` uses `getPrincipal()` which derives auth from REST request headers, NOT from STOMP session — this will fail for WebSocket messages that aren't piggybacking on an HTTP session. **Needs runtime verification** — likely broken for pure STOMP clients.
- ⚠️ `WebSocketMessagePayload` is a package-private record — acceptable for single-file use
- ⚠️ No security check on WebSocket message handler — relies on `getPrincipal()` returning null, but doesn't reject; just silently returns

### Service (`ConversationService.java:156`)

| Operation | Status | Notes |
|---|---|---|
| Create conversation | ✅ | Deduplicates existing conversations by exact participant match |
| List conversations | ✅ | Sorted by `lastMessageAt DESC`, nulls last |
| Get messages (paginated) | ✅ | Participant authorization check |
| Send message | ✅ | With participant authorization check |

**Critical issue — N+1 query problem in `getConversations()`:**

The `toResponse()` method is called per conversation and makes 4 database queries per conversation:
```
1. participantRepository.findByConversationId()        — find other user
2. userProfileRepository.findByUserId()                 — get display name
3. messageRepository.findByConversationIdOrderBySentAtDesc(limit 1) — last message
4. conversationRepository.findById()                    — get createdAt
```
For a user with 20 conversations, this is 1 (list) + 20×4 = **81 queries**. This should use JOIN FETCH or a custom `@Query`.

**Business logic gaps:**
- ⚠️ `sendMessage()` does NOT update `conversation.updatedAt` (the entity doesn't even have one) — last message time is derived from the message table at query time
- ⚠️ `getMessages()` returns `sentAt DESC` from backend, but DmChatComponent reverses it — inefficient
- ⚠️ `blocked` user check: **not implemented** — blocked users can still send messages and appear in conversation lists
- ⚠️ No pagination on conversation list — all conversations returned at once; no limit/sort

### Entities

**Conversation** (`V14 migration + Conversation.java`)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | Default `gen_random_uuid()` |
| created_at | TIMESTAMPTZ | |

Minimal entity — only 2 columns. No `updated_at`, no `last_message_at`, no `title` (for group chats).

**ConversationParticipant**
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| conversation_id | UUID FK→conversations | ON DELETE CASCADE, indexed |
| user_id | UUID FK→users | ON DELETE CASCADE, indexed |
| joined_at | TIMESTAMPTZ | |

Unique constraint on `(conversation_id, user_id)`. Index on both columns.

**Message** (`V14 migration + Message.java`)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| conversation_id | UUID FK→conversations | ON DELETE CASCADE, indexed |
| sender_id | UUID FK→users | ON DELETE CASCADE |
| body | TEXT | Required |
| sent_at | TIMESTAMPTZ | Indexed `(conversation_id, sent_at ASC)` |
| read_at | TIMESTAMPTZ | Nullable — column exists but **never populated** |

**What's NOT in the schema:**
| Missing Column | Purpose |
|---|---|
| `message_type` (ENUM) | Text, image, file, system message (e.g., "User joined") |
| `reactions` (JSONB or separate table) | Emoji reactions per message |
| `is_deleted` (BOOLEAN) | Soft delete for messages |
| `edited_at` (TIMESTAMPTZ) | Track edits |
| `reply_to_id` (UUID FK) | Quoting/reply to specific message |
| `attachment_url` (VARCHAR) | File/image in message |

### Repositories

- `ConversationRepository`: 2 custom queries — `findConversationIdsByUserId` (simple list) and `findConversationWithExactParticipants` (GROUP BY/HAVING for dedup)
- `ConversationParticipantRepository`: 2 queries — findByConversationId and findById+UserId
- `MessageRepository`: 1 query — `findByConversationIdOrderBySentAtDesc`

All repositories are minimal. No aggregation queries for unread counts, no pagination on conversation list, no `countBy` for badges.

---

## Frontend

### `DmService` (frontend, `dm.service.ts:51`)

| Method | Endpoint | Status | Used By |
|---|---|---|---|
| `createConversation()` | POST `/api/conversations` | ✅ | DmListComponent |
| `getConversations()` | GET `/api/conversations` | ✅ | DmListComponent |
| `getMessages()` | GET `/{id}/messages?page=&size=` | ✅ | DmChatComponent |
| `sendMessage()` | POST `/{id}/messages` | ✅ | DmChatComponent |

**Missing methods:**
- No STOMP client call to `/chat.sendMessage`
- No `deleteMessage()`, `markAsRead()`, `editMessage()`, `leaveConversation()`

### `DmListComponent` (`dm-list.component.ts:205`)

| Feature | Status | Notes |
|---|---|---|
| Conversation list | ✅ | Loaded from API, displayed as cards |
| Last message preview | ✅ | Shows `c.lastMessage` with ellipsis overflow |
| Timestamp | ✅ | Shows `lastMessageAt | date:'MMM d, h:mm a'` |
| Unread count | ❌ | No badge or indicator |
| Online status | ❌ | No green dot or "online" label |
| Avatar | ⚠️ | Initials-only avatar from first character of display name/username |
| Start new conversation | ✅ | Username search → createConversation → navigate |
| Search user error | ✅ | Shows "User not found" on API error |
| Create conversation error | ✅ | Shows "Failed to create conversation" |
| Empty state | ✅ | "No conversations yet" |
| Loading state | ✅ | "Loading conversations..." |
| Pagination | ❌ | No pagination or infinite scroll; backend returns all |
| Responsive | ✅ | Stacks input/button on mobile ≤767px |

**Navigation bug**: `startConversation()` creates a conversation via backend API, then navigates to `/dm/{conversationId}` — this is correct. However, the `ProfileViewComponent.message()` at line 550 navigates to `/dm/{username}` which is **not** a valid route since the DM chat expects a conversation UUID. This is a cross-feature integration bug flagged in the main audit.

### `DmChatComponent` (`dm-chat.component.ts:181`)

| Feature | Status | Notes |
|---|---|---|
| Message rendering | ✅ | `own`/`other` styling with bubble layout |
| Message timeline | ✅ | Ordered ascending (API returns DESC, reversed in component) |
| Send message | ✅ | REST POST with optimistic local push |
| Timestamps | ✅ | `date:'h:mm a'` per message |
| Back navigation | ✅ | "Back to Messages" link |
| Empty state | ✅ | "No messages yet" |
| Loading state | ✅ | "Loading messages..." |
| Real-time via STOMP | ❌ | **No WebSocket subscription** — `WebSocketService` only subscribes to `/user/queue/notifications`, never to `/topic/chat/{id}` |
| Auto-scroll to bottom | ❌ | No `scrollIntoView` or `ViewChild` scroll on new message |
| Read receipts | ❌ | `readAt` column exists in DB but never populated by backend or displayed on frontend |
| Typing indicator | ❌ | Not implemented anywhere |
| Message reactions | ❌ | No emoji reactions |
| Message deletion | ❌ | No delete button or swipe-to-delete |
| Message editing | ❌ | No edit functionality |
| Image/file sending | ❌ | Text-only input, no file picker |
| Emoji picker | ❌ | No emoji selector |
| Message grouping/stickiness | ❌ | No grouping by sender or date separators |
| Scroll anchor to bottom | ❌ | No auto-scroll or "Scroll to bottom" FAB |
| User profile link | ❌ | Clicking avatar/name does not navigate to profile |
| Character/validation | ❌ | `@NotBlank` on backend but no frontend validation except `.trim()` |

---

## Data Flow

```
DM List (GET /api/conversations — returns all conversations)
    ↓ start new conversation
        search userByUsername → createConversation(participantIds) → navigate /dm/{id}
    ↓ click conversation card
DM Chat (GET /api/conversations/{id}/messages?page=0&size=200)
    ↓ send message (POST /api/conversations/{id}/messages) — local push to array
    ↓ backend broadcasts to /topic/chat/{conversationId}
    ⚠️ frontend does NOT subscribe to /topic/chat/{conversationId}
    ⚠️ other participants never receive real-time updates
```

---

## Gaps (ranked by user impact)

| # | Gap | Component | Severity | Impact |
|---|---|---|---|---|
| G1 | **No real-time message delivery** — `WebSocketService` never subscribes to `/topic/chat/{id}`; other participants don't receive messages in real-time | DmChatComponent + WebSocketService | **Critical** | DM feature is effectively non-functional for real-time conversations — users must manually refresh |
| G2 | **Profile "Message" button navigates to wrong URL** — `/dm/:username` instead of `/dm/:conversationId` | ProfileViewComponent | **Critical** | Cross-feature integration broken; crashes the DM page |
| G3 | **No read receipts** — `read_at` column exists in DB but never populated by backend or displayed on frontend | Backend + DmChatComponent | **High** | Users cannot see if their message was read |
| G4 | **No message deletion** — no backend endpoint, no frontend UI | Global | **High** | Users cannot retract sent messages (no undo, no delete) |
| G5 | **No typing indicator** — no STOMP topic, no frontend UI | Global | **Medium** | Users don't know if the other person is typing |
| G6 | **No attachment/file/image sending** — text-only messages | Global | **Medium** | Cannot share images or files in DMs |
| G7 | **No auto-scroll to bottom** on new message or page load | DmChatComponent | **Medium** | User must manually scroll; new messages render off-screen |
| G8 | **No unread count** on conversation list | DmListComponent | **Medium** | No visual badge for conversations with unread messages |
| G9 | **No online/offline status** | DmListComponent | **Low** | No presence indication |
| G10 | **No message reactions / emoji** | DmChatComponent | **Low** | Cannot react to messages |
| G11 | **N+1 query problem** — `getConversations()` makes 4 queries per conversation | Backend ConversationService | **Medium** | ~81 queries for 20 conversations; scales poorly |
| G12 | **WS auth likely broken** — `getPrincipal()` on STOMP handler reads from HTTP security context, not STOMP session headers | Backend ConversationController | **High** | STOMP messages may fail authentication; **needs runtime verification** |
| G13 | **No pagination on conversation list** — one big response | Backend + DmListComponent | **Low** | Fine for now but won't scale for heavy DM users |
| G14 | **No message grouping by sender** — consecutive messages from same sender should omit avatar/name | DmChatComponent | **Low** | Visual clutter in rapid back-and-forth |
| G15 | **No "leave conversation"** — no endpoint or UI to leave/delete a conversation | Global | **Low** | Conversations accumulate forever |

---

## Recommendations (Top 5, ordered)

### 1. Fix real-time STOMP subscription
- In `DmChatComponent`, subscribe to `/topic/chat/{conversationId}` via `WebSocketService` (or add a dedicated DM subscription method)
- On receiving a STOMP message, append it to `this.messages` and scroll to bottom
- Ensure auth works on STOMP channel (pass JWT as STOMP header, not HTTP context)
- **Effort**: Medium — requires WebSocket service refactoring + auth plumbing

### 2. Fix Profile "Message" navigation
- Change `ProfileViewComponent.message()` to call `DmService.createConversation({ participantIds: [profileId] })` then navigate to the returned `conv.id`
- Match the pattern already used in `DmListComponent.startConversation()`
- **Effort**: Trivial (single method change)

### 3. Implement read receipts
- Add `PUT /api/conversations/{id}/read` endpoint that sets `read_at = NOW()` for all unread messages by the current user
- Frontend: call on component init and on window focus
- Display: show a "Read" label or double-check icon on own messages when `readAt !== null`
- **Effort**: Low-Medium

### 4. Fix N+1 in `getConversations()`
- Replace per-conversation queries with batch queries: fetch all participants for all conversation IDs in one query, fetch all profiles in one query, fetch all last messages in one query
- Alternatively add `@EntityGraph` or `@Query` with JOIN FETCH
- **Effort**: Low

### 5. Add message deletion
- Backend: `DELETE /api/conversations/{id}/messages/{messageId}` — soft delete (set `is_deleted` flag or `body = '[deleted]'`) with author-only authorization
- Frontend: long-press or context menu on own messages → "Delete" option
- **Effort**: Medium

---

## Summary Statistics

| Category | Count |
|---|---|
| Backend endpoints | 5 total (4 REST + 1 STOMP) |
| Frontend service methods | 4 total |
| Frontend components | 2 (DmList, DmChat) |
| Features implemented (usable) | 4 (list conversations, start conversation, view messages, send via REST) |
| Features broken | 2 (real-time delivery not subscribed, Profile→DM navigation fails) |
| Features partially implemented | 1 (read_at schema exists but unused) |
| Features missing completely | 10 (message delete, message edit, read receipt display, typing indicator, file/image, emoji reactions, message grouping, unread badges, online status, leave conversation) |
| N+1 queries | Critical — 4 queries per conversation in list view |
| Auth concern | STOMP handler auth likely broken (HTTP context vs STOMP session) |
