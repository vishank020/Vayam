-- Add slug column as nullable first
ALTER TABLE communities ADD COLUMN slug VARCHAR(100);

-- Populate slug by converting name to lowercase, replacing spaces/whitespace with hyphens,
-- and removing any non-alphanumeric/non-hyphen/non-space characters.
UPDATE communities
SET slug = regexp_replace(
             regexp_replace(
               regexp_replace(
                 lower(name),
                 '[^a-z0-9\s-]', '', 'g'
               ),
               '\s+', '-', 'g'
             ),
             '-+', '-', 'g'
           );

-- Trim leading/trailing hyphens (if any)
UPDATE communities SET slug = regexp_replace(slug, '^-|-$', '', 'g');

-- Set default/fallback to UUID text for any null/empty/duplicate slugs to guarantee uniqueness
UPDATE communities
SET slug = id::text
WHERE slug IS NULL
   OR slug = ''
   OR slug IN (
       SELECT slug
       FROM communities
       GROUP BY slug
       HAVING COUNT(*) > 1
   );

-- Set NOT NULL and UNIQUE constraints
ALTER TABLE communities ALTER COLUMN slug SET NOT NULL;
ALTER TABLE communities ADD CONSTRAINT uk_communities_slug UNIQUE (slug);
