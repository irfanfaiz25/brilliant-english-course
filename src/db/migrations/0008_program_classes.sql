CREATE TYPE "public"."school_grade" AS ENUM('tk', 'sd1', 'sd2', 'sd3', 'sd4', 'sd5', 'sd6', 'smp1', 'smp2', 'smp3');--> statement-breakpoint
CREATE TABLE "program_class_translations" (
	"class_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"focus" varchar(120) DEFAULT '' NOT NULL,
	CONSTRAINT "program_class_translations_class_id_locale_pk" PRIMARY KEY("class_id","locale")
);
--> statement-breakpoint
CREATE TABLE "program_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level_id" uuid NOT NULL,
	"name" varchar(60) NOT NULL,
	"grade_from" "school_grade" NOT NULL,
	"grade_to" "school_grade" NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_classes_grade_range" CHECK ("program_classes"."grade_from" <= "program_classes"."grade_to")
);
--> statement-breakpoint
CREATE TABLE "unit_classes" (
	"unit_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	CONSTRAINT "unit_classes_unit_id_class_id_pk" PRIMARY KEY("unit_id","class_id")
);
--> statement-breakpoint
ALTER TABLE "unit_levels" ADD COLUMN "all_classes" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "program_class_translations" ADD CONSTRAINT "program_class_translations_class_id_program_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."program_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_classes" ADD CONSTRAINT "program_classes_level_id_program_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."program_levels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_classes" ADD CONSTRAINT "unit_classes_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_classes" ADD CONSTRAINT "unit_classes_class_id_program_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."program_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "program_classes_level_id_idx" ON "program_classes" USING btree ("level_id");--> statement-breakpoint
CREATE INDEX "unit_classes_class_id_idx" ON "unit_classes" USING btree ("class_id");