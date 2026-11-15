/**
 * Starter content for production (ADR-046): programs and classes, activities, FAQ, three real
 * partner units and the head office contact, so the site makes sense on launch day. Run once
 * from the tools image after `pnpm db:regions` (`docs/DEPLOY.md` § 6):
 *
 *   pnpm db:starter            # shows what it would add and checks the database
 *   pnpm db:starter --confirm  # adds it, in one transaction
 *
 * Unlike the development seed it may run on production, but only into empty content tables: it
 * never changes or deletes anything, and a contact setting already saved in admin is kept. No
 * testimonials, blog posts or sample leads: those must be real and come from the BEC team.
 */
import { parseArgs } from "node:util";

import nextEnv from "@next/env";
import { inArray, sql } from "drizzle-orm";

nextEnv.loadEnvConfig(process.cwd());

async function main() {
  const { values } = parseArgs({ options: { confirm: { type: "boolean", default: false } } });

  // Imported after the env is loaded: these modules validate it on import.
  const [{ db, closeDb }, schema, content, starter, insert] = await Promise.all([
    import("@/db/client"),
    import("@/db/schema"),
    import("./content"),
    import("./starter/content"),
    import("./insert"),
  ]);

  try {
    const counts = {
      regions: schema.regions,
      program_levels: schema.programLevels,
      activities: schema.activities,
      units: schema.units,
      faq_items: schema.faqItems,
    } as const;
    const found: Record<string, number> = {};
    for (const [name, table] of Object.entries(counts)) {
      const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(table);
      found[name] = row?.n ?? 0;
    }

    if (found.regions === 0) throw new Error("No regions found. Run `pnpm db:regions` first.");
    const filled = Object.entries(found).filter(([name, n]) => name !== "regions" && n > 0);
    if (filled.length > 0) {
      throw new Error(
        `Refusing: content already exists (${filled.map(([name, n]) => `${name}: ${n}`).join(", ")}). ` +
          "The starter content only goes into an empty database; edit content in admin instead.",
      );
    }

    // Every unit village must be a real Kemendagri village.
    const villages = starter.starterUnits.map((unit) => unit.villageCode);
    const known = await db
      .select({ code: schema.regions.code })
      .from(schema.regions)
      .where(inArray(schema.regions.code, villages));
    const missing = villages.filter((code) => !known.some((row) => row.code === code));
    if (missing.length > 0) throw new Error(`Unknown village codes: ${missing.join(", ")}`);

    const summary =
      `${content.levelFixtures.id.length} program levels with their classes, ` +
      `${content.activityFixtures.id.length} activities, ${content.faqFixtures.id.length} FAQ items, ` +
      `${starter.starterUnits.length} units (${starter.starterUnits.map((unit) => unit.code).join(", ")}) ` +
      "and the head office contact (unless already saved)";

    if (!values.confirm) {
      console.log(`Ready to add ${summary}.\nRun again with --confirm to add it.`);
      return;
    }

    await db.transaction(async (tx) => {
      const mediaId = await insert.insertPlaceholderMedia(tx);
      const programIds = await insert.insertLevels(tx, content.levelFixtures, mediaId);
      await insert.insertActivities(tx, content.activityFixtures, mediaId);
      await insert.insertFaq(tx, content.faqFixtures);
      await insert.insertUnits(tx, starter.starterUnits, programIds);
      await tx
        .insert(schema.settings)
        .values({ key: "contact", value: starter.starterContact })
        .onConflictDoNothing();
    });

    console.log(`Added ${summary}.`);
  } finally {
    await closeDb();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
