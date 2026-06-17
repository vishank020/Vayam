CREATE TABLE community_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    name VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive unique constraint on (community_id, name)
CREATE UNIQUE INDEX idx_community_tags_unique_name ON community_tags(community_id, LOWER(name));

-- Add tag_id to posts table
ALTER TABLE posts ADD COLUMN tag_id UUID REFERENCES community_tags(id) ON DELETE SET NULL;
CREATE INDEX idx_posts_tag_id ON posts(tag_id);
