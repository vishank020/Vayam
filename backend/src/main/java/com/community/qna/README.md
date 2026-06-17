# Q&A Module

Handles the Questions and Answers functionality for the platform.

## Features

- **Questions**: Users can ask questions (which are internally linked to or act as a specific type of Post).
- **Answers**: Users can post answers to specific questions.
- **Acceptance**: The author of the question can mark an answer as the accepted/correct answer.

## Key Classes

- `QnaController` — REST endpoints for `/api/questions/*`
- `QnaService` — Business logic for asking questions, answering, and accepting answers.
- `Question` & `Answer` — JPA entities (or representations) mapping to the Q&A tables.
- `CreateQuestionRequest` & `AnswerQuestionRequest` — DTO records for incoming requests.
- `QuestionResponse` & `AnswerResponse` — DTO records for outgoing data.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/questions` | Required | Ask a new question |
| GET | `/api/questions` | Public | List all questions (paginated) |
| GET | `/api/questions/{id}` | Public | Get a question and its answers |
| POST | `/api/questions/{id}/answers` | Required | Post an answer to a question |
| PUT | `/api/questions/{id}/answers/{answerId}/accept` | Required | Accept an answer (question author only) |
| DELETE | `/api/questions/{id}` | Required | Delete a question (author only) |
