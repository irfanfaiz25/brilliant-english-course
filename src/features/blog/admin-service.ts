import "server-only";

import { and, eq, isNull, ne } from "drizzle-orm";

import { limits } from "@/config/limits";
import type { Database } from "@/db/client";
import { db } from "@/db/client";
import { postImages, posts, postTranslations } from "@/db/schema";
import type { SessionUser } from "@/features/users/schema";
import type { Locale } from "@/i18n/routing";
import { ActionFailure } from "@/lib/action-result";
import { writeAuditLog } from "@/lib/audit";
import { can } from "@/lib/permissions";

import { documentMediaIds } from "./rich-text";
import type { PostForm } from "./schema";
import { fromJakartaInput } from "./service";

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
type Text = NonNullable<PostForm["texts"]["en"]>;

/** The written languages of a form: Indonesian always, English when it was filled in. */
const writtenTexts = (form: PostForm): [Locale, Text][] => [
  ["id", form.texts.id],
  ...(form.texts.en ? ([["en", form.texts.en]] as [Locale, Text][]) : []),
];

/**
 * Publishing and archiving need the `publish` permission; anyone who may edit can keep a draft.
 * A published post cannot be edited back into a draft by someone without it either.
 */
function assertMayPublish(
  actor: SessionUser,
  next: PostForm["status"],
  before?: PostForm["status"],
) {
  const touchesPublishing = next !== "draft" || (before !== undefined && before !== "draft");
  if (touchesPublishing && next !== before && !can(actor, "publish", "blog")) {
    throw new ActionFailure("invalid", { status: "publishForbidden" });
  }
}

/** Slugs must be unique per language (the URL `/blog/<slug>` of that language). */
async function assertSlugsFree(tx: Tx, form: PostForm, postId?: string) {
  const fieldErrors: Record<string, string> = {};
  for (const [locale, text] of writtenTexts(form)) {
    const [taken] = await tx
      .select({ postId: postTranslations.postId })
      .from(postTranslations)
      .where(
        and(
          eq(postTranslations.locale, locale),
          eq(postTranslations.slug, text.slug),
          ...(postId ? [ne(postTranslations.postId, postId)] : []),
        ),
      )
      .limit(1);
    if (taken) fieldErrors[`texts.${locale}.slug`] = "postSlugTaken";
  }
  if (Object.keys(fieldErrors).length > 0) throw new ActionFailure("invalid", fieldErrors);
}

/** `publishedAt` to store: the chosen date, else the old one, else now when it goes live. */
function publishedAtFor(form: PostForm, before: Date | null): Date | null {
  if (form.publishedAt) return fromJakartaInput(form.publishedAt);
  if (before) return before;
  return form.status === "published" ? new Date() : null;
}

/** Replaces the post's languages and its list of library images in the body. */
async function writeTexts(tx: Tx, postId: string, form: PostForm) {
  await tx.delete(postTranslations).where(eq(postTranslations.postId, postId));
  await tx.insert(postTranslations).values(
    writtenTexts(form).map(([locale, text]) => ({
      postId,
      locale,
      slug: text.slug,
      title: text.title,
      excerpt: text.excerpt,
      coverAlt: text.coverAlt,
      content: text.content,
    })),
  );
  const mediaIds = [
    ...new Set(writtenTexts(form).flatMap(([, text]) => documentMediaIds(text.content))),
  ];
  await tx.delete(postImages).where(eq(postImages.postId, postId));
  if (mediaIds.length > 0) {
    await tx.insert(postImages).values(mediaIds.map((mediaId) => ({ postId, mediaId })));
  }
}

const postColumns = (form: PostForm, publishedAt: Date | null) => ({
  category: form.category,
  status: form.status,
  coverImageId: form.coverImageId,
  authorName: form.authorName,
  authorRole: form.authorRole,
  publishedAt,
});

export async function createPost(form: PostForm, actor: SessionUser): Promise<{ id: string }> {
  assertMayPublish(actor, form.status);
  return db.transaction(async (tx) => {
    await assertSlugsFree(tx, form);
    const [row] = await tx
      .insert(posts)
      .values(postColumns(form, publishedAtFor(form, null)))
      .returning({ id: posts.id });
    if (!row) throw new Error("Post was not inserted.");
    await writeTexts(tx, row.id, form);
    await writeAuditLog(tx, {
      actorId: actor.id,
      action: "post.create",
      entityType: "post",
      entityId: row.id,
      changes: { title: form.texts.id.title, status: form.status, english: !!form.texts.en },
    });
    return { id: row.id };
  });
}

export async function updatePost(
  id: string,
  form: PostForm,
  actor: SessionUser,
): Promise<{ id: string }> {
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select({ status: posts.status, publishedAt: posts.publishedAt })
      .from(posts)
      .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
      .for("update");
    if (!before) throw new ActionFailure("notFound");
    assertMayPublish(actor, form.status, before.status);
    await assertSlugsFree(tx, form, id);
    await tx
      .update(posts)
      .set({
        ...postColumns(form, publishedAtFor(form, before.publishedAt)),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id));
    await writeTexts(tx, id, form);
    await writeAuditLog(tx, {
      actorId: actor.id,
      action: "post.update",
      entityType: "post",
      entityId: id,
      changes: {
        title: form.texts.id.title,
        english: !!form.texts.en,
        ...(before.status !== form.status
          ? { status: { from: before.status, to: form.status } }
          : {}),
      },
    });
    return { id };
  });
}

/**
 * Soft delete: the post leaves the blog and the list; the audit row keeps its title. Its slugs
 * are renamed so a new post can use them again (the slug index covers deleted posts too).
 */
export async function deletePost(id: string, actor: SessionUser): Promise<null> {
  await db.transaction(async (tx) => {
    const texts = await tx
      .select({
        locale: postTranslations.locale,
        slug: postTranslations.slug,
        title: postTranslations.title,
      })
      .from(postTranslations)
      .innerJoin(posts, eq(posts.id, postTranslations.postId))
      .where(and(eq(postTranslations.postId, id), isNull(posts.deletedAt)));
    if (texts.length === 0) throw new ActionFailure("notFound");
    await tx.update(posts).set({ deletedAt: new Date() }).where(eq(posts.id, id));
    const suffix = `-dihapus-${id.slice(0, 8)}`;
    for (const text of texts) {
      await tx
        .update(postTranslations)
        .set({ slug: `${text.slug.slice(0, limits.blog.slugMax - suffix.length)}${suffix}` })
        .where(and(eq(postTranslations.postId, id), eq(postTranslations.locale, text.locale)));
    }
    await writeAuditLog(tx, {
      actorId: actor.id,
      action: "post.delete",
      entityType: "post",
      entityId: id,
      changes: {
        title: texts.find((text) => text.locale === "id")?.title,
        slugs: Object.fromEntries(texts.map((text) => [text.locale, text.slug])),
      },
    });
  });
  return null;
}
