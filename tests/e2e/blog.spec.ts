import { expect, test, type Page } from "@playwright/test";

/** Visible matches only: streamed Suspense content can briefly exist twice (see finder.spec). */
const visible = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true });

const POST = "/blog/anak-malu-bicara-bahasa-inggris";

test.describe("blog index", () => {
  test("features the newest post and pages the rest", async ({ page }) => {
    await page.goto("/blog");

    await expect(
      page.getByRole("heading", { level: 1, name: "Tips & Cerita dari Kelas BEC" }),
    ).toBeVisible();
    await expect(visible(page, "8 artikel")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Artikel terbaru" }).getByRole("link", {
        name: "7 Cara Seru Mengajak Anak Berbicara Bahasa Inggris di Rumah",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Daftar artikel" }).getByRole("article"),
    ).toHaveCount(6);

    await page.getByRole("link", { name: "Halaman 2" }).click();
    await expect(page).toHaveURL(/\/blog\?halaman=2#artikel$/);
    await expect(
      page.getByRole("list", { name: "Daftar artikel" }).getByRole("article"),
    ).toHaveCount(1);
  });

  test("filters by category through the URL", async ({ page }) => {
    await page.goto("/blog");
    await page
      .getByRole("navigation", { name: "Kategori artikel" })
      .getByRole("link", { name: "Kegiatan" })
      .click();

    await expect(page).toHaveURL(/\/blog\?kategori=kegiatan$/);
    await expect(visible(page, "2 artikel")).toBeVisible();
    await expect(page.getByRole("region", { name: "Artikel terbaru" })).toHaveCount(0);
    await expect(
      page
        .getByRole("navigation", { name: "Kategori artikel" })
        .getByRole("link", { name: "Kegiatan" }),
    ).toHaveAttribute("aria-current", "page");
  });
});

test.describe("blog post", () => {
  test("renders the article with structured data and a next step", async ({ page }) => {
    await page.goto(POST);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Anak Malu Bicara Bahasa Inggris? Ini yang Bisa Orang Tua Lakukan",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Yang sebaiknya dilakukan" }),
    ).toHaveAttribute("id", "yang-sebaiknya-dilakukan");
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.some((data) => data.includes('"@type":"BlogPosting"'))).toBe(true);
    await expect(page.getByRole("link", { name: "Cek Unit Terdekat" }).first()).toHaveAttribute(
      "href",
      "/cek-unit",
    );
    await expect(page.getByRole("heading", { name: "Artikel Lainnya untuk Kamu" })).toBeVisible();
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      "href",
      /\/en\/blog\/child-shy-about-speaking-english$/,
    );
  });

  test("table of contents jumps to a section", async ({ page, isMobile }) => {
    await page.goto(POST);
    const toc = page.getByRole("navigation", { name: "Daftar isi" }).filter({ visible: true });
    if (isMobile) await toc.getByRole("button", { name: "Daftar isi" }).click();
    await toc.getByRole("link", { name: "Yang sebaiknya dihindari" }).click();

    await expect(page).toHaveURL(/#yang-sebaiknya-dihindari$/);
    await expect(page.getByRole("heading", { name: "Yang sebaiknya dihindari" })).toBeInViewport();
  });

  test("switching language keeps the reader on the same post", async ({ page }) => {
    await page.goto(POST);
    await page
      .getByRole("contentinfo")
      .getByRole("navigation", { name: "Ganti bahasa" })
      .getByRole("link", { name: "English" })
      .click();

    await expect(page).toHaveURL(/\/en\/blog\/child-shy-about-speaking-english$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Is Your Child Shy About Speaking English? Here's How to Help",
      }),
    ).toBeVisible();
  });

  test("unknown posts show the 404 page", async ({ page }) => {
    await page.goto("/blog/artikel-yang-tidak-ada");
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).not.toHaveCount(0);
  });
});
