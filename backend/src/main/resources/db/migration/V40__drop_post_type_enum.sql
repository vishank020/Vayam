-- V40: Drop post_type native enum, change to VARCHAR
-- Hibernate's @Enumerated(EnumType.STRING) sends VARCHAR parameters which
-- PostgreSQL cannot compare against the native post_type enum even with
-- the implicit cast added in V9. Converting to VARCHAR(50) fixes this.
ALTER TABLE posts ALTER COLUMN post_type DROP DEFAULT;
ALTER TABLE posts ALTER COLUMN post_type TYPE VARCHAR(50) USING post_type::text;
ALTER TABLE posts ALTER COLUMN post_type SET DEFAULT 'GENERAL';

DROP CAST IF EXISTS (character varying AS post_type);
DROP TYPE IF EXISTS post_type;
