CREATE TYPE "public"."level_theme" AS ENUM('sunny', 'teal', 'orange', 'blue', 'green', 'berry');--> statement-breakpoint
ALTER TABLE "program_levels" ADD COLUMN "theme" "level_theme" DEFAULT 'teal' NOT NULL;--> statement-breakpoint
ALTER TABLE "program_levels" ADD COLUMN "in_age_finder" boolean DEFAULT true NOT NULL;--> statement-breakpoint
-- Keep the colors the three original levels had when they were fixed in code (ADR-028).
UPDATE "program_levels" SET "theme" = CASE "slug"
  WHEN 'kindy' THEN 'sunny'::"level_theme"
  WHEN 'secondary' THEN 'orange'::"level_theme"
  ELSE 'teal'::"level_theme"
END;
