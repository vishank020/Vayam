-- V9: Add implicit cast from VARCHAR to post_type enum
-- Without this, Hibernate's @Enumerated(EnumType.STRING) sends VARCHAR
-- which PostgreSQL rejects on the native post_type enum column.
CREATE CAST (character varying AS post_type) WITH INOUT AS IMPLICIT;
