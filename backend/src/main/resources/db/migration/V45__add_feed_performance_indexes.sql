-- V45: Add indexes for feed query performance
-- The personalized feed JPQL subquery (WHERE user.id IN (SELECT m.community.id FROM CommunityMember m WHERE m.user.id = :userId))
-- scans community_members without a user_id index, causing sequential scans.
-- Post_votes and post_saves also lack covering indexes for batch count lookups.

CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_post_direction ON post_votes(post_id, direction);
CREATE INDEX IF NOT EXISTS idx_post_saves_post_user ON post_saves(post_id, user_id);
