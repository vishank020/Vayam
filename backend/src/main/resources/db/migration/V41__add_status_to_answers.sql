-- V41: Add status column to answers table for draft support
ALTER TABLE answers ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'PUBLISHED';
