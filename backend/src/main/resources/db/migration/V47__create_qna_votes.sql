CREATE TABLE qna_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL,
    target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('QUESTION', 'ANSWER')),
    value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, target_id, target_type)
);

CREATE INDEX idx_qna_votes_target ON qna_votes(target_id, target_type);
