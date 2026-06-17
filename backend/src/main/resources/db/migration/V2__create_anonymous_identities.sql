-- V2: Create anonymous identities table
-- Fully detached from users table — no FK link.
-- Each anonymous identity is tied only to a session token hash.

CREATE TABLE anonymous_identities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token_hash VARCHAR(64) UNIQUE NOT NULL,      -- SHA-256 of session token
    display_name    VARCHAR(50) NOT NULL,                 -- Auto-generated alias, e.g. "Curious Raven"
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_active_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_anon_session ON anonymous_identities (session_token_hash);
