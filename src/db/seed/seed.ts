/**
 * Development seed (`pnpm db:seed`): loads the sample content written during Phase 5 (programs,
 * activities, units, quota reservations, testimonials, FAQ, blog posts and their placeholder
 * photos) plus a few sample partner leads (`MTR-DEV-*`), so the public site and admin show
 * realistic data. Regions must be loaded first (`pnpm db:regions`); users and real leads are never
 * touched, and settings are only added when missing (the Kemitraan page sample photos).
 *
 *   pnpm db:seed           # only into an empty content database
 *   pnpm db:seed --reset   # delete the seeded content tables first, then seed again
 *
 * Refuses any database that is not local Docker or CI's throwaway database.
 */
import { parseArgs } from "node:util";

import nextEnv from "@next/env";
import { and, eq, inArray, like, sql } from "drizzle-orm";

nextEnv.loadEnvConfig(process.cwd());

/** Students per sample unit, so network statistics look plausible (computed, never typed in). */
const SAMPLE_STUDENTS = [64, 58, 41, 72, 55, 38, 47, 60];

async function main() {
  const { values } = parseArgs({ options: { reset: { type: "boolean", default: false } } });

  // Imported after the env is loaded: these modules validate it on import.
  const [{ db, closeDb }, schema, { env }, plan, content, insert] = await Promise.all([
    import("@/db/client"),
    import("@/db/schema"),
    import("@/lib/env"),
    import("./plan"),
    import("./content"),
    import("./insert"),
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
        schema.unitClasses,
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
      // The Kemitraan settings point at those sample photos by id; seed them again below.
      await tx
        .delete(schema.settings)
        .where(inArray(schema.settings.key, ["partnership", "partnershipTraining"]));
      // The sample conversions' audit rows go with their leads.
      await tx
        .delete(schema.auditLog)
        .where(
          and(
            eq(schema.auditLog.action, "lead.convert"),
            sql`${schema.auditLog.changes} ->> 'sample' = 'true'`,
          ),
        );
      await tx
        .delete(schema.partnerLeads)
        .where(like(schema.partnerLeads.reference, `${plan.SAMPLE_LEAD_PREFIX}%`));
    }

    // Placeholder photos as media rows, looked up by path below.
    const mediaId = await insert.insertPlaceholderMedia(tx);

    const programIds = await insert.insertLevels(tx, content.levelFixtures, mediaId);

    // Kemitraan page: the code defaults with sample photos, unless an admin already saved them.
    const kit = content.partnershipKitFixture(mediaId);
    const training = content.partnershipTrainingFixture(mediaId);
    await tx
      .insert(schema.settings)
      .values([
        { key: "partnership", value: kit },
        { key: "partnershipTraining", value: training },
      ])
      .onConflictDoNothing();

    await insert.insertActivities(tx, content.activityFixtures, mediaId);

    // Units, newest first in the sample list (the home page features the most recent ones).
    const today = Date.now();
    const unitIds = await insert.insertUnits(
      tx,
      content.unitFixtures.map((unit, index) => ({
        ...unit,
        studentsCount: SAMPLE_STUDENTS[index] ?? 40,
        openedAt: new Date(today - (index + 1) * 30 * 86_400_000).toISOString().slice(0, 10),
        classNames: content.unitClassFixtures[unit.code],
      })),
      programIds,
    );

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

    await insert.insertFaq(tx, content.faqFixtures);

    // Sample partner leads for the admin overview (fictional people, real villages).
    await tx.insert(schema.partnerLeads).values(
      content.sampleLeads.map((lead, index) => ({
        ...lead,
        reference: `${plan.SAMPLE_LEAD_PREFIX}${String(index + 1).padStart(4, "0")}`,
        createdAt: new Date(today - lead.daysAgo * 86_400_000),
      })),
    );

    // A year of applications for Ringkasan's charts; conversions get their audit row, dated the
    // day the sample unit opened (the trend counts `lead.convert` rows).
    const history = content.leadHistory();
    const historyRows = await tx
      .insert(schema.partnerLeads)
      .values(
        history.map((lead, index) => ({
          fullName: lead.fullName,
          whatsapp: lead.whatsapp,
          background: lead.background,
          space: lead.space,
          villageCode: lead.villageCode,
          status: lead.status,
          locale: "id" as const,
          motivation: "Sample application (dev seed)",
          unitId: lead.conversion ? unitIds[lead.conversion.unitIndex] : null,
          reference: `${plan.SAMPLE_LEAD_PREFIX}${String(1000 + index + 1).padStart(4, "0")}`,
          createdAt: new Date(today - lead.daysAgo * 86_400_000),
          updatedAt: new Date(
            today - (lead.conversion?.convertedDaysAgo ?? lead.daysAgo) * 86_400_000,
          ),
        })),
      )
      .returning({ id: schema.partnerLeads.id });
    const conversions = history.flatMap((lead, index) => {
      const row = historyRows[index];
      if (!lead.conversion || !row) return [];
      return [
        {
          actorId: null,
          action: "lead.convert",
          entityType: "partner_lead",
          entityId: row.id,
          changes: {
            status: { from: "onboarding", to: "converted" },
            unitId: unitIds[lead.conversion.unitIndex],
            sample: true,
          },
          createdAt: new Date(today - lead.conversion.convertedDaysAgo * 86_400_000),
        },
      ];
    });
    if (conversions.length > 0) await tx.insert(schema.auditLog).values(conversions);

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
        (["id", "en"] as const).flatMap((locale) => {
          const translation = record.translations[locale];
          return translation ? [{ postId: row.id, locale, ...translation }] : [];
        }),
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
