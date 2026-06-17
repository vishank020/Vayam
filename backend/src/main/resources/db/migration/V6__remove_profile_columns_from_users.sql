-- V6: Remove profile columns from users table
-- WHY: Profile data (display_name, bio, avatar_url, public_key) now lives
-- exclusively in user_profiles table. This migration drops the duplicate
-- columns from users after defensively backfilling any missing profile rows.

INSERT INTO user_profiles (id, user_id, created_at, updated_at)
SELECT gen_random_uuid(), u.id, NOW(), NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
);

ALTER TABLE users
    DROP COLUMN display_name,
    DROP COLUMN bio,
    DROP COLUMN avatar_url,
    DROP COLUMN public_key;
