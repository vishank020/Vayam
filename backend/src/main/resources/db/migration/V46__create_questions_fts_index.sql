CREATE INDEX IF NOT EXISTS idx_questions_fts ON questions
  USING GIN (to_tsvector('english', title || ' ' || body));
