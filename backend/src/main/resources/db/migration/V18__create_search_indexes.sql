CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN (
  to_tsvector('english', title || ' ' || coalesce(content, ''))
);

CREATE INDEX IF NOT EXISTS idx_communities_search ON communities USING GIN (
  to_tsvector('english', name || ' ' || coalesce(description, ''))
);

CREATE INDEX IF NOT EXISTS idx_users_search ON users USING GIN (
  to_tsvector('english', username)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_search ON user_profiles USING GIN (
  to_tsvector('english', display_name || ' ' || coalesce(bio, ''))
);
