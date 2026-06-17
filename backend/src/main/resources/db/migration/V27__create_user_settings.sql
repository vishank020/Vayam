CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(50) DEFAULT 'system',
    notify_comments BOOLEAN DEFAULT true,
    notify_replies BOOLEAN DEFAULT true,
    notify_mentions BOOLEAN DEFAULT true,
    notify_follows BOOLEAN DEFAULT true,
    notify_system BOOLEAN DEFAULT true,
    show_email BOOLEAN DEFAULT false,
    show_website BOOLEAN DEFAULT true,
    show_location BOOLEAN DEFAULT true,
    allow_discovery BOOLEAN DEFAULT true,
    allow_follow_requests BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE TRIGGER set_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
