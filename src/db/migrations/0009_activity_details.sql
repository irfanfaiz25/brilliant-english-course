CREATE TABLE "activity_photo_translations" (
	"photo_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"caption" varchar(80) DEFAULT '' NOT NULL,
	CONSTRAINT "activity_photo_translations_photo_id_locale_pk" PRIMARY KEY("photo_id","locale")
);
--> statement-breakpoint
CREATE TABLE "activity_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_translations" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_translations" ADD COLUMN "highlights" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_translations" ADD COLUMN "skills" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_translations" ADD COLUMN "schedule" varchar(80) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_photo_translations" ADD CONSTRAINT "activity_photo_translations_photo_id_activity_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."activity_photos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_photos" ADD CONSTRAINT "activity_photos_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_photos" ADD CONSTRAINT "activity_photos_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_photos_activity_id_idx" ON "activity_photos" USING btree ("activity_id","sort_order");--> statement-breakpoint
CREATE INDEX "activity_photos_media_id_idx" ON "activity_photos" USING btree ("media_id");