import { expect, test, type Page } from "@playwright/test";

const jsonLdTypes = async (page: Page) =>
  (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");

test.describe("unit directory and area pages", () => {
  test("the directory links provinces and regencies", async ({ page }) => {
    await page.goto("/unit");

    await expect(
      page.getByRole("heading", { level: 1, name: "Unit BEC di Berbagai Wilayah" }),
    ).toBeVisible();
    await page.getByRole("link", { name: /Kota Depok/ }).click();
    await expect(page).toHaveURL(/\/unit\/jawa-barat\/kota-depok$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Kursus Bahasa Inggris Anak di Kota Depok" }),
    ).toBeVisible();
  });

  test("a regency page lists its units with structured data", async ({ page }) => {
    await page.goto("/unit/jawa-barat/kab-bogor");

    await expect(page.getByRole("heading", { level: 3, name: /^Unit / })).toHaveCount(4);
    expect(await jsonLdTypes(page)).toContain('"@type":"ItemList"');
    await expect(page.getByRole("link", { name: "Urutkan dari lokasiku" })).toHaveAttribute(
      "href",
      "/cek-unit?wilayah=32.01&dekat=1",
    );
    await expect(page.getByRole("link", { name: "Cek kuota desamu" })).toHaveAttribute(
      "href",
      "/kemitraan?wilayah=32.01#kuota",
    );
  });

  test("a province page links to its regencies", async ({ page }) => {
    await page.goto("/unit/jawa-barat");
    await expect(
      page.getByRole("heading", { name: "Kabupaten & Kota di Jawa Barat" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Kab\. Bekasi/ })).toHaveAttribute(
      "href",
      "/unit/jawa-barat/kab-bekasi",
    );
  });

  test("unknown areas show the 404 page", async ({ page }) => {
    await page.goto("/unit/banten");
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).not.toHaveCount(0);
  });
});

test.describe("unit page", () => {
  test("shows contact actions, classes and nearby units", async ({ page }) => {
    await page.goto("/unit/jawa-barat/kab-bogor/sukamaju");

    await expect(page.getByRole("heading", { level: 1, name: "Unit Sukamaju" })).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: "Chat WhatsApp" }).first(),
    ).toHaveAttribute("href", /^https:\/\/wa\.me\/6281200000001/);
    await expect(page.getByRole("link", { name: "Buka di Google Maps" })).toHaveAttribute(
      "href",
      /google\.com\/maps\/search/,
    );
    await expect(page.getByRole("link", { name: "Lihat program Secondary" })).toHaveAttribute(
      "href",
      "/program#secondary",
    );
    await expect(page.getByRole("heading", { name: "Unit Lain di Sekitar" })).toBeVisible();
    expect(await jsonLdTypes(page)).toContain('"@type":"LocalBusiness"');
  });

  test("finder result cards link to unit pages", async ({ page }) => {
    await page.goto("/cek-unit?q=kukusan");
    await page.getByRole("link", { name: "Unit Kukusan" }).filter({ visible: true }).click();

    await expect(page).toHaveURL(/\/unit\/jawa-barat\/kota-depok\/kukusan$/);
    await expect(page.getByRole("heading", { level: 1, name: "Unit Kukusan" })).toBeVisible();
  });

  test("English unit page uses the localized prefix", async ({ page }) => {
    await page.goto("/en/units/jawa-barat/kota-depok/kukusan");
    await expect(page).toHaveTitle(/Kids' English Course in Beji, Kota Depok/);
    await expect(page.locator('link[rel="alternate"][hreflang="id"]')).toHaveAttribute(
      "href",
      /\/unit\/jawa-barat\/kota-depok\/kukusan$/,
    );
  });
});
