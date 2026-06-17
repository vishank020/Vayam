ALTER TABLE reports ADD COLUMN IF NOT EXISTS reported_post_id UUID REFERENCES posts(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_reports_reported_post ON reports(reported_post_id);
