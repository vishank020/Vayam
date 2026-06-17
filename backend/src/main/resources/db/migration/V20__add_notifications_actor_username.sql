ALTER TABLE notifications ADD COLUMN actor_username VARCHAR(255);

CREATE INDEX idx_notifications_actor_username ON notifications(actor_username);
