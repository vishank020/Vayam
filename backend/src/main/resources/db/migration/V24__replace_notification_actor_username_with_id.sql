ALTER TABLE notifications ADD COLUMN actor_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notifications DROP COLUMN actor_username;
