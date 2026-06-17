-- V1: Create users table
-- Core user table for authentication and profile information.
-- Emails are stored as SHA-256 hash for privacy; the raw email is never stored.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50) UNIQUE NOT NULL,
    email_hash      VARCHAR(64) UNIQUE NOT NULL,        -- SHA-256 of email
    password_hash   VARCHAR(255) NOT NULL,               -- BCrypt hash
    display_name    VARCHAR(100),
    bio             TEXT,
    avatar_url      VARCHAR(500),
    public_key      TEXT,                                -- RSA public key for E2EE
    role            VARCHAR(20) NOT NULL DEFAULT 'USER', -- USER, MOD, ADMIN
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email_hash ON users (email_hash);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
