-- Fuzzy search on region and unit names (trigram indexes) and accent-insensitive matching.
-- Both are trusted extensions on PostgreSQL 13+, so the database owner can create them.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;
