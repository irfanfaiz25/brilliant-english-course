ALTER TABLE "media_assets" ADD COLUMN "name" varchar(120) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "uploaded_by_id" uuid;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_assets_created_at_idx" ON "media_assets" USING btree ("created_at");--> statement-breakpoint
-- Existing rows (bundled placeholders) are named after their file.
UPDATE "media_assets" SET "name" = left(regexp_replace("key", '^.*/|\.[a-z0-9]+$', '', 'g'), 120) WHERE "name" = '';
