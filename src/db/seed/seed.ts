/**
 * Development seed (`pnpm db:seed`): loads the sample content written during Phase 5 (programs,
 * activities, units, quota reservations, testimonials, FAQ, blog posts and their placeholder
 * photos) plus a few sample partner leads (`MTR-DEV-*`), so the public site and admin show
 * realistic data. Regions must be loaded first (`pnpm db:regions`); users, settings and real
 * leads are never touched.
 *
 *   pnpm db:seed           # only into an empty content database
 *   pnpm db:seed --reset   # delete the seeded content tables first, then seed again
 *
 * Refuses any database that is not local Docker or CI's throwaway database.
 */
import { parseArgs } from "node:util";

import nextEnv from "@next/env";
import { inArray, like, sql } from "drizzle-orm";

nextEnv.loadEnvConfig(process.cwd());

/** Students per sample unit, so network statistics look plausible (computed, never typed in). */
const SAMPLE_STUDENTS = [64, 58, 41, 72, 55, 38, 47, 60];

async function main() {
  const { values } = parseArgs({ options: { reset: { type: "boolean", default: false } } });

  // Imported after the env is loaded: these modules validate it on import.
  const [{ db, closeDb }, schema, { env }, plan, content, { placeholderImages }] =
    await Promise.all([
      import("@/db/client"),
      import("@/db/schema"),
      import("@/lib/env"),
      import("./plan"),
      import("./content"),
      import("@/config/placeholder-images"),
    ]);

  if (env.NODE_ENV === "production") throw new Error("Refusing to seed with NODE_ENV=production.");
  if (!plan.isSeedableDatabase(env.DATABASE_URL, env.CI === true)) {
    throw new Error("Refusing to seed a non-local database. The seed is for local Docker and CI.");
  }

  const [{ regionCount } = { regionCount: 0 }] = await db
    .select({ regionCount: sql<number>`count(*)::int` })
    .from(schema.regions);
  if (regionCount === 0) throw new Error("No regions found. Run `pnpm db:regions` first.");

  const [{ existing } = { existing: 0 }] = await db
    .select({ existing: sql<number>`count(*)::int` })
    .from(schema.programLevels);
  if (existing > 0 && !values.reset) {
    throw new Error("Content already exists. Run `pnpm db:seed --reset` to replace it.");
  }

  await db.transaction(async (tx) => {
    if (values.reset) {
      // Children first; translations cascade from their parents.
      for (const table of [
        schema.quotaReservations,
        schema.unitPhotos,
        schema.unitLevels,
        schema.units,
        schema.programLevels,
        schema.activities,
        schema.posts,
        schema.testimonials,
        schema.faqItems,
      ]) {
        await tx.delete(table);
      }
      await tx.delete(schema.mediaAssets).where(like(schema.mediaAssets.key, "/placeholders/%"));
      await tx
        .delete(schema.partnerLeads)
        .where(like(schema.partnerLeads.reference, `${plan.SAMPLE_LEAD_PREFIX}%`));
    }

    // Placeholder photos as media rows, looked up by path below.
    const media = await tx
      .insert(schema.mediaAssets)
      .values(
        Object.values(placeholderImages).map((image) => ({
          key: image.src,
          name: image.src.replace(/^.*\/|\.[a-z0-9]+$/g, ""),
          mimeType: "image/webp",
          width: image.width,
          height: image.height,
        })),
      )
      .returning({ id: schema.mediaAssets.id, key: schema.mediaAssets.key });
    const mediaId = (src: string) => {
      const found = media.find((row) => row.key === src);
      if (!found) throw new Error(`No media row for ${src}`);
      return found.id;
    };

    // Program levels.
    const levels = plan.pairByKey(content.levelFixtures, (level) => level.slug);
    const levelIds = new Map<string, string>();
    for (const [index, { key, id, en }] of levels.entries()) {
      const [row] = await tx
        .insert(schema.programLevels)
        .values({
          slug: key,
          ageMin: id.ageMin,
          ageMax: id.ageMax,
          sessionsPerWeek: id.sessionsPerWeek,
          maxStudentsPerClass: id.maxStudentsPerClass,
          imageId: mediaId(id.image.src),
          sortOrder: index,
        })
        .returning({ id: schema.programLevels.id });
      if (!row) throw new Error(`Level ${key} was not inserted`);
      levelIds.set(key, row.id);
      await tx.insert(schema.programLevelTranslations).values(
        (["id", "en"] as const).map((locale) => {
          const text = locale === "id" ? id : en;
          return {
            levelId: row.id,
            locale,
            name: text.name,
            tagline: text.tagline,
            summary: text.summary,
            skills: text.skills,
            description: text.description,
            curriculum: text.curriculum,
            imageAlt: text.image.alt,
          };
        }),
      );
    }

    // Activities.
    for (const [index, { key, id, en }] of plan
      .pairByKey(content.activityFixtures, (activity) => activity.slug)
      .entries()) {
      const [row] = await tx
        .insert(schema.activities)
        .values({ slug: key, imageId: mediaId(id.image.src), sortOrder: index })
        .returning({ id: schema.activities.id });
      if (!row) throw new Error(`Activity ${key} was not inserted`);
      await tx.insert(schema.activityTranslations).values(
        [id, en].map((text, i) => ({
          activityId: row.id,
          locale: i === 0 ? ("id" as const) : ("en" as const),
          name: text.name,
          summary: text.summary,
          audience: text.audience,
          imageAlt: text.image.alt,
        })),
      );
    }

    // Units, newest first in the sample list (the home page features the most recent ones).
    const today = Date.now();
    for (const [index, unit] of content.unitFixtures.entries()) {
      const [row] = await tx
        .insert(schema.units)
        .values({
          code: unit.code,
          slug: unit.slug,
          name: unit.name,
          status: "active",
          enrollment: unit.enrollment,
          villageCode: unit.villageCode,
          address: unit.address,
          latitude: unit.location.lat,
          longitude: unit.location.lng,
          managerName: unit.manager,
          whatsapp: unit.whatsapp,
          openDays: unit.openDays,
          opensAt: unit.opensAt,
          closesAt: unit.closesAt,
          studentsCount: SAMPLE_STUDENTS[index] ?? 40,
          openedAt: new Date(today - (index + 1) * 30 * 86_400_000).toISOString().slice(0, 10),
        })
        .returning({ id: schema.units.id });
      if (!row) throw new Error(`Unit ${unit.code} was not inserted`);
      await tx.insert(schema.unitLevels).values(
        unit.levels.map((slug) => {
          const levelId = levelIds.get(slug);
          if (!levelId) throw new Error(`Unknown level ${slug}`);
          return { unitId: row.id, levelId };
        }),
      );
    }

    if (content.quotaReservationFixtures.length > 0) {
      await tx.insert(schema.quotaReservations).values(
        content.quotaReservationFixtures.map((reservation) => ({
          villageCode: reservation.villageCode,
          slots: reservation.slots,
          note: "Sample reservation (dev seed)",
        })),
      );
    }

    // Testimonials.
    for (const [index, { id, en }] of plan
      .pairByKey(content.testimonialFixtures, (item) => item.id)
      .entries()) {
      const [row] = await tx
        .insert(schema.testimonials)
        .values({
          audience: id.audience,
          authorName: id.author,
          rating: id.rating,
          sortOrder: index,
          isPublished: true,
        })
        .returning({ id: schema.testimonials.id });
      if (!row) throw new Error(`Testimonial ${id.id} was not inserted`);
      await tx.insert(schema.testimonialTranslations).values([
        { testimonialId: row.id, locale: "id", quote: id.quote, role: id.role },
        { testimonialId: row.id, locale: "en", quote: en.quote, role: en.role },
      ]);
    }

    // FAQ.
    for (const [index, { id, en }] of plan
      .pairByKey(content.faqFixtures, (item) => item.id)
      .entries()) {
      const [row] = await tx
        .insert(schema.faqItems)
        .values({ topic: id.topic, sortOrder: index })
        .returning({ id: schema.faqItems.id });
      if (!row) throw new Error(`FAQ ${id.id} was not inserted`);
      await tx.insert(schema.faqItemTranslations).values([
        { faqItemId: row.id, locale: "id", question: id.question, answer: id.answer },
        { faqItemId: row.id, locale: "en", question: en.question, answer: en.answer },
      ]);
    }

    // Sample partner leads for the admin overview (fictional people, real villages).
    await tx.insert(schema.partnerLeads).values(
      content.sampleLeads.map((lead, index) => ({
        ...lead,
        reference: `${plan.SAMPLE_LEAD_PREFIX}${String(index + 1).padStart(4, "0")}`,
        createdAt: new Date(today - lead.daysAgo * 86_400_000),
      })),
    );

    // Blog posts.
    for (const record of content.postFixtures) {
      const publishedAt = plan.jakartaMorning(record.publishedAt);
      const [row] = await tx
        .insert(schema.posts)
        .values({
          category: record.category,
          status: "published",
          coverImageId: mediaId(record.cover.src),
          authorName: record.author.name,
          authorRole: record.author.role,
          publishedAt,
          createdAt: publishedAt,
          updatedAt: plan.jakartaMorning(record.updatedAt ?? record.publishedAt),
        })
        .returning({ id: schema.posts.id });
      if (!row) throw new Error(`Post ${record.id} was not inserted`);
      await tx.insert(schema.postTranslations).values(
        (["id", "en"] as const).map((locale) => ({
          postId: row.id,
          locale,
          ...record.translations[locale],
        })),
      );
    }
  });

  // Every unit village must be a real Kemendagri code (the foreign key already enforces it).
  const villages = content.unitFixtures.map((unit) => unit.villageCode);
  const found = await db
    .select({ code: schema.regions.code })
    .from(schema.regions)
    .where(inArray(schema.regions.code, villages));
  console.log(
    `Seeded ${content.levelFixtures.id.length} levels, ${content.activityFixtures.id.length} activities, ` +
      `${content.unitFixtures.length} units (${found.length} villages), ` +
      `${content.testimonialFixtures.id.length} testimonials, ${content.faqFixtures.id.length} FAQ items, ` +
      `${content.postFixtures.length} posts.`,
  );

  await closeDb();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
