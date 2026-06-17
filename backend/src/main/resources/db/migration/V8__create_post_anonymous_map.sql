-- post_anonymous_map: links anonymous posts to their real authors
-- NEVER joined in public queries - only accessible via internal moderation service
CREATE TABLE post_anonymous_map (
    post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_anonymous_post UNIQUE (user_id, post_id)
);

CREATE INDEX idx_post_anonymous_map_user_id ON post_anonymous_map(user_id);