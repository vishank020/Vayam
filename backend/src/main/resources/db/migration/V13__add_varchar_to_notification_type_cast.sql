-- V13: Add implicit cast from VARCHAR to notification_type enum
-- Without this, Hibernate's @Enumerated(EnumType.STRING) sends VARCHAR
-- which PostgreSQL rejects on the native notification_type enum column.
CREATE CAST (character varying AS notification_type) WITH INOUT AS IMPLICIT;
