import { describe, expect, it } from "vitest";

import { slugify } from "@/lib/slug";

import { bold, doc, h2, h3, link, p, ul } from "./doc-builders";
import { postFixtures } from "@/db/seed/content/blog";
import { blogQuery, parseBlogParams } from "./index-params";
import { postRecordSchema, type PostSummary } from "./schema";
import {
  documentText,
  extractHeadings,
  paginatePosts,
  readingMinutes,
  relatedPosts,
  toPost,
  toPostRecord,
} from "./service";

const summary = (id: string, category: PostSummary["category"]): PostSummary =>
  ({ id, category }) as PostSummary;

describe("post fixtures", () => {
  it("are valid, with unique slugs per locale", () => {
    postFixtures.forEach((record) => postRecordSchema.parse(record));
    for (const locale of ["id", "en"] as const) {
      const slugs = postFixtures.flatMap((record) => record.translations[locale]?.slug ?? []);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});

describe("rich text helpers", () => {
  const content = doc(
    p("Hello ", bold("world"), " ", link("here", "/cek-unit")),
    h2("Tips & Trik!"),
    ul("one", ["two ", bold("three")]),
    h3("Tips & Trik"),
    h2("Ápa Kabar"),
  );

  it("extracts plain text", () => {
    expect(documentText(content)).toBe(
      "Hello world here Tips & Trik! one two three Tips & Trik Ápa Kabar",
    );
  });

  it("builds unique, ASCII heading anchors in order", () => {
    expect(extractHeadings(content)).toEqual([
      { id: "tips-trik", text: "Tips & Trik!", level: 2 },
      { id: "tips-trik-2", text: "Tips & Trik", level: 3 },
      { id: "apa-kabar", text: "Ápa Kabar", level: 2 },
    ]);
    expect(slugify("  Hello,  World ")).toBe("hello-world");
  });

  it("estimates reading time with a one-minute minimum", () => {
    expect(readingMinutes(doc(p("short")))).toBe(1);
    expect(readingMinutes(doc(p(Array.from({ length: 600 }, () => "word").join(" "))))).toBe(3);
  });
});

describe("toPost", () => {
  it("resolves one locale and keeps every slug", () => {
    const record = postFixtures[0];
    const en = record?.translations.en;
    if (!record || !en) throw new Error("the first fixture needs both languages");
    const post = toPost(record, "en");
    expect(post?.slug).toBe(en.slug);
    expect(post?.slugs).toEqual({ id: record.translations.id.slug, en: en.slug });
    expect(post?.cover.alt).toBe(en.coverAlt);
  });

  it("has no English post when English is not written", () => {
    const record = postFixtures[0];
    if (!record) throw new Error("fixtures are empty");
    const indonesianOnly = { ...record, translations: { id: record.translations.id } };
    expect(toPost(indonesianOnly, "en")).toBeNull();
    expect(toPost(indonesianOnly, "id")?.slugs).toEqual({ id: record.translations.id.slug });
  });
});

describe("paginatePosts", () => {
  const posts = Array.from({ length: 8 }, (_, index) => summary(`p${index}`, "parenting"));

  it("features the newest post on page 1 and pages the rest", () => {
    const first = paginatePosts(posts, { page: 1, featureFirst: true, pageSize: 6 });
    expect(first.featured?.id).toBe("p0");
    expect(first.items.map((post) => post.id)).toEqual(["p1", "p2", "p3", "p4", "p5", "p6"]);
    expect(first.totalPages).toBe(2);

    const second = paginatePosts(posts, { page: 2, featureFirst: true, pageSize: 6 });
    expect(second.featured).toBeNull();
    expect(second.items.map((post) => post.id)).toEqual(["p7"]);
  });

  it("clamps out-of-range pages", () => {
    expect(paginatePosts(posts, { page: 99, featureFirst: false, pageSize: 6 }).page).toBe(2);
    expect(paginatePosts(posts, { page: -1, featureFirst: false, pageSize: 6 }).page).toBe(1);
    expect(paginatePosts([], { page: 1, featureFirst: true }).totalPages).toBe(1);
  });
});

describe("relatedPosts", () => {
  it("prefers the same category and skips the current post", () => {
    const posts = [
      summary("a", "kegiatan"),
      summary("b", "parenting"),
      summary("c", "kegiatan"),
      summary("d", "kemitraan"),
    ];
    expect(relatedPosts(posts, { id: "a", category: "kegiatan" }, 3).map((p) => p.id)).toEqual([
      "c",
      "b",
      "d",
    ]);
  });
});

describe("blog index params", () => {
  it("parses valid values and drops invalid ones", () => {
    expect(parseBlogParams({ kategori: "parenting", halaman: "2" })).toEqual({
      category: "parenting",
      page: 2,
    });
    expect(parseBlogParams({ kategori: "unknown", halaman: "0" })).toEqual({
      category: undefined,
      page: 1,
    });
    expect(parseBlogParams({ kategori: ["kegiatan", "x"] }).category).toBe("kegiatan");
  });

  it("builds short queries", () => {
    expect(blogQuery({ page: 1 })).toEqual({});
    expect(blogQuery({ category: "kemitraan", page: 3 })).toEqual({
      kategori: "kemitraan",
      halaman: "3",
    });
  });
});

describe("toPostRecord", () => {
  const translation = {
    slug: "judul",
    title: "Judul artikel yang cukup panjang",
    excerpt: "Ringkasan artikel yang cukup panjang untuk kartu.",
    coverAlt: "Foto",
    content: { type: "doc" as const, content: [{ type: "paragraph" as const }] },
  };
  const stored = {
    id: "p1",
    category: "parenting" as const,
    cover: { src: "/placeholders/hero-girl-writing.webp", width: 1600, height: 1067 },
    author: { name: "Tim BEC", role: "Kurikulum" },
    // 23:30 UTC on Nov 5 is already Nov 6 in Jakarta (UTC+7).
    publishedAt: new Date("2026-11-05T23:30:00Z"),
    updatedAt: new Date("2026-11-06T02:00:00Z"),
    translations: { id: translation, en: { ...translation, slug: "title" } },
  };

  it("uses Jakarta calendar days and hides same-day edits", () => {
    const record = toPostRecord(stored);
    expect(record.publishedAt).toBe("2026-11-06");
    expect(record.updatedAt).toBeUndefined();
    expect(record.translations.en?.slug).toBe("title");
  });

  it("keeps a later update day", () => {
    const record = toPostRecord({ ...stored, updatedAt: new Date("2026-11-09T03:00:00Z") });
    expect(record.updatedAt).toBe("2026-11-09");
  });
});
