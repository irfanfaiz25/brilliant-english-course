CREATE TYPE "public"."locale" AS ENUM('id', 'en');--> statement-breakpoint
CREATE TYPE "public"."post_category" AS ENUM('tips-belajar', 'parenting', 'kegiatan', 'kemitraan');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."faq_topic" AS ENUM('parents', 'program', 'partners');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'telegram', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('queued', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'onboarding', 'converted', 'rejected', 'lost');--> statement-breakpoint
CREATE TYPE "public"."partner_background" AS ENUM('educator', 'parent', 'entrepreneur', 'other');--> statement-breakpoint
CREATE TYPE "public"."partner_space" AS ENUM('ready', 'preparing', 'notYet');--> statement-breakpoint
CREATE TYPE "public"."region_level" AS ENUM('province', 'regency', 'district', 'village');--> statement-breakpoint
CREATE TYPE "public"."seo_entity_type" AS ENUM('page', 'program', 'post', 'unit');--> statement-breakpoint
CREATE TYPE "public"."testimonial_audience" AS ENUM('parent', 'partner');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('open', 'limited', 'full');--> statement-breakpoint
CREATE TYPE "public"."unit_status" AS ENUM('onboarding', 'active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'editor', 'mitra');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"image_id" uuid,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "activity_translations" (
	"activity_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"name" varchar(80) NOT NULL,
	"summary" text NOT NULL,
	"audience" varchar(60) NOT NULL,
	"image_alt" varchar(200) DEFAULT '' NOT NULL,
	CONSTRAINT "activity_translations_activity_id_locale_pk" PRIMARY KEY("activity_id","locale")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(40) NOT NULL,
	"entity_id" varchar(160) NOT NULL,
	"changes" jsonb,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_translations" (
	"post_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(110) NOT NULL,
	"excerpt" varchar(200) NOT NULL,
	"cover_alt" varchar(200) DEFAULT '' NOT NULL,
	"content" jsonb NOT NULL,
	CONSTRAINT "post_translations_post_id_locale_pk" PRIMARY KEY("post_id","locale")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "post_category" NOT NULL,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"cover_image_id" uuid,
	"author_name" varchar(120) NOT NULL,
	"author_role" varchar(120) NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "faq_item_translations" (
	"faq_item_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"question" varchar(200) NOT NULL,
	"answer" text NOT NULL,
	CONSTRAINT "faq_item_translations_faq_item_id_locale_pk" PRIMARY KEY("faq_item_id","locale")
);
--> statement-breakpoint
CREATE TABLE "faq_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" "faq_topic" NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"size_bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event" varchar(64) NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"recipient" varchar(254) NOT NULL,
	"status" "notification_status" DEFAULT 'queued' NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"error" text,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "partner_lead_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"author_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(20) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"whatsapp" varchar(16) NOT NULL,
	"email" varchar(254),
	"background" "partner_background" NOT NULL,
	"space" "partner_space" NOT NULL,
	"motivation" text DEFAULT '' NOT NULL,
	"village_code" varchar(13) NOT NULL,
	"locale" "locale" NOT NULL,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"assigned_to_id" uuid,
	"unit_id" uuid,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "partner_leads_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "program_level_translations" (
	"level_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"name" varchar(80) NOT NULL,
	"tagline" varchar(120) NOT NULL,
	"summary" text NOT NULL,
	"skills" text[] NOT NULL,
	"description" text NOT NULL,
	"curriculum" text[] NOT NULL,
	"image_alt" varchar(200) DEFAULT '' NOT NULL,
	CONSTRAINT "program_level_translations_level_id_locale_pk" PRIMARY KEY("level_id","locale")
);
--> statement-breakpoint
CREATE TABLE "program_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(40) NOT NULL,
	"age_min" smallint NOT NULL,
	"age_max" smallint NOT NULL,
	"sessions_per_week" smallint NOT NULL,
	"max_students_per_class" smallint NOT NULL,
	"image_id" uuid,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_levels_slug_unique" UNIQUE("slug"),
	CONSTRAINT "program_levels_age_range" CHECK ("program_levels"."age_min" <= "program_levels"."age_max")
);
--> statement-breakpoint
CREATE TABLE "quota_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"village_code" varchar(13) NOT NULL,
	"slots" smallint DEFAULT 1 NOT NULL,
	"lead_id" uuid,
	"note" text DEFAULT '' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quota_reservations_slots_positive" CHECK ("quota_reservations"."slots" > 0)
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"code" varchar(13) PRIMARY KEY NOT NULL,
	"parent_code" varchar(13),
	"level" "region_level" NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT "regions_code_format" CHECK ("regions"."code" ~ '^\d{2}(\.\d{2}(\.\d{2}(\.\d{4})?)?)?$')
);
--> statement-breakpoint
CREATE TABLE "seo_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "seo_entity_type" NOT NULL,
	"entity_id" varchar(160) NOT NULL,
	"locale" "locale" NOT NULL,
	"title" varchar(70),
	"description" varchar(160),
	"og_image_id" uuid,
	"noindex" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonial_translations" (
	"testimonial_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"quote" text NOT NULL,
	"role" varchar(120) NOT NULL,
	CONSTRAINT "testimonial_translations_testimonial_id_locale_pk" PRIMARY KEY("testimonial_id","locale")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audience" "testimonial_audience" NOT NULL,
	"author_name" varchar(120) NOT NULL,
	"rating" smallint NOT NULL,
	"unit_id" uuid,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "testimonials_rating_range" CHECK ("testimonials"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "unit_levels" (
	"unit_id" uuid NOT NULL,
	"level_id" uuid NOT NULL,
	CONSTRAINT "unit_levels_unit_id_level_id_pk" PRIMARY KEY("unit_id","level_id")
);
--> statement-breakpoint
CREATE TABLE "unit_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"caption" varchar(200) DEFAULT '' NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(12) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"status" "unit_status" DEFAULT 'onboarding' NOT NULL,
	"enrollment" "enrollment_status" DEFAULT 'open' NOT NULL,
	"village_code" varchar(13) NOT NULL,
	"address" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"manager_name" varchar(120) NOT NULL,
	"whatsapp" varchar(16) NOT NULL,
	"open_days" smallint[] NOT NULL,
	"opens_at" time NOT NULL,
	"closes_at" time NOT NULL,
	"students_count" integer DEFAULT 0 NOT NULL,
	"opened_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "units_code_unique" UNIQUE("code"),
	CONSTRAINT "units_village_level" CHECK (length("units"."village_code") = 13),
	CONSTRAINT "units_coordinates" CHECK ("units"."latitude" between -90 and 90 and "units"."longitude" between -180 and 180)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(254) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'editor' NOT NULL,
	"unit_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_translations" ADD CONSTRAINT "activity_translations_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_translations" ADD CONSTRAINT "post_translations_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_image_id_media_assets_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_item_translations" ADD CONSTRAINT "faq_item_translations_faq_item_id_faq_items_id_fk" FOREIGN KEY ("faq_item_id") REFERENCES "public"."faq_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_lead_notes" ADD CONSTRAINT "partner_lead_notes_lead_id_partner_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."partner_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_lead_notes" ADD CONSTRAINT "partner_lead_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_leads" ADD CONSTRAINT "partner_leads_village_code_regions_code_fk" FOREIGN KEY ("village_code") REFERENCES "public"."regions"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_leads" ADD CONSTRAINT "partner_leads_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_leads" ADD CONSTRAINT "partner_leads_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_level_translations" ADD CONSTRAINT "program_level_translations_level_id_program_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."program_levels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_levels" ADD CONSTRAINT "program_levels_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quota_reservations" ADD CONSTRAINT "quota_reservations_village_code_regions_code_fk" FOREIGN KEY ("village_code") REFERENCES "public"."regions"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quota_reservations" ADD CONSTRAINT "quota_reservations_lead_id_partner_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."partner_leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quota_reservations" ADD CONSTRAINT "quota_reservations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_parent_code_regions_code_fk" FOREIGN KEY ("parent_code") REFERENCES "public"."regions"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_overrides" ADD CONSTRAINT "seo_overrides_og_image_id_media_assets_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonial_translations" ADD CONSTRAINT "testimonial_translations_testimonial_id_testimonials_id_fk" FOREIGN KEY ("testimonial_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_levels" ADD CONSTRAINT "unit_levels_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_levels" ADD CONSTRAINT "unit_levels_level_id_program_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."program_levels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_photos" ADD CONSTRAINT "unit_photos_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_photos" ADD CONSTRAINT "unit_photos_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_village_code_regions_code_fk" FOREIGN KEY ("village_code") REFERENCES "public"."regions"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "post_translations_locale_slug_idx" ON "post_translations" USING btree ("locale","slug");--> statement-breakpoint
CREATE INDEX "posts_status_published_at_idx" ON "posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "notification_log_created_at_idx" ON "notification_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_log_status_idx" ON "notification_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "partner_lead_notes_lead_id_idx" ON "partner_lead_notes" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "partner_leads_status_idx" ON "partner_leads" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "partner_leads_village_code_idx" ON "partner_leads" USING btree ("village_code");--> statement-breakpoint
CREATE INDEX "partner_leads_whatsapp_idx" ON "partner_leads" USING btree ("whatsapp");--> statement-breakpoint
CREATE INDEX "quota_reservations_village_code_idx" ON "quota_reservations" USING btree ("village_code");--> statement-breakpoint
CREATE INDEX "regions_parent_code_idx" ON "regions" USING btree ("parent_code","name");--> statement-breakpoint
CREATE INDEX "regions_level_idx" ON "regions" USING btree ("level");--> statement-breakpoint
CREATE INDEX "regions_name_trgm_idx" ON "regions" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "seo_overrides_entity_idx" ON "seo_overrides" USING btree ("entity_type","entity_id","locale");--> statement-breakpoint
CREATE INDEX "unit_photos_unit_id_idx" ON "unit_photos" USING btree ("unit_id","sort_order");--> statement-breakpoint
CREATE INDEX "units_village_code_idx" ON "units" USING btree ("village_code");--> statement-breakpoint
CREATE INDEX "units_status_idx" ON "units" USING btree ("status");--> statement-breakpoint
CREATE INDEX "units_slug_idx" ON "units" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree (lower("email"));