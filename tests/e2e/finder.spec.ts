import { expect, test, type Page } from "@playwright/test";

/**
 * Visible text only: while results stream in, React briefly keeps the new markup in a hidden
 * node before swapping it in, so the same text can exist twice for a moment.
 */
const visibleText = (page: Page, text: string) => page.getByText(text).filter({ visible: true });

const unitCards = (page: Page) =>
  page.getByRole("article").filter({ has: page.getByText(/Kode Unit/) });

test.describe("unit finder", () => {
  test("lists every active unit by default", async ({ page }) => {
    await page.goto("/cek-unit");

    await expect(
      page.getByRole("heading", { level: 1, name: "Temukan Unit BEC Terdekat" }),
    ).toBeVisible();
    await expect(visibleText(page, "8 unit aktif di jaringan BEC")).toBeVisible();
    await expect(unitCards(page)).toHaveCount(8);
  });

  test("searches as you type and keeps the query in the URL", async ({ page }) => {
    await page.goto("/cek-unit");
    await page
      .getByRole("searchbox", { name: "Cari nama unit, kecamatan, atau kota" })
      .fill("depok");

    await expect(page).toHaveURL(/\?q=depok$/);
    await expect(unitCards(page)).toHaveCount(2);
    await expect(page.getByRole("link", { name: "Hapus filter “depok”" })).toBeVisible();
  });

  test("shows a partnership path when an area has no unit", async ({ page }) => {
    await page.goto("/cek-unit?wilayah=36.03.01.2001");

    await expect(
      page.getByRole("heading", { name: "Belum ada unit BEC di Bitung Jaya" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Jadi mitra pertama di sini" })).toHaveAttribute(
      "href",
      "/kemitraan?wilayah=36.03.01.2001#daftar",
    );
    await expect(page.getByRole("link", { name: "Cari di Cikupa" })).toHaveAttribute(
      "href",
      "/cek-unit?wilayah=36.03.01",
    );
  });

  test("English finder uses its localized URL", async ({ page }) => {
    await page.goto("/en/find-a-unit?q=depok");

    await expect(page).toHaveTitle(/Find the Nearest BEC Unit/);
    await expect(visibleText(page, "2 units for “depok”")).toBeVisible();
  });
});

test.describe("unit finder region cascade (desktop)", () => {
  test.skip(({ isMobile }) => isMobile, "desktop side panel");

  test("narrows results level by level and clears with the chip", async ({ page }) => {
    await page.goto("/cek-unit");
    const panel = page.getByRole("complementary", { name: "Filter pencarian unit" });

    await expect(panel.getByRole("combobox", { name: "Kabupaten / Kota" })).toBeDisabled();
    await panel.getByRole("combobox", { name: "Provinsi" }).selectOption({ label: "Jawa Barat" });
    await expect(page).toHaveURL(/\?wilayah=32$/);

    await panel
      .getByRole("combobox", { name: "Kabupaten / Kota" })
      .selectOption({ label: "Kab. Bogor" });
    await expect(page).toHaveURL(/\?wilayah=32\.01$/);
    await expect(visibleText(page, "4 unit aktif di Kab. Bogor")).toBeVisible();

    await page.getByRole("link", { name: "Hapus filter Kab. Bogor" }).click();
    await expect(visibleText(page, "8 unit aktif di jaringan BEC")).toBeVisible();
  });
});

test.describe("unit finder region sheet (mobile)", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile bottom sheet");

  test("filters from the bottom sheet", async ({ page }) => {
    await page.goto("/cek-unit");
    await page.getByRole("button", { name: "Filter wilayah" }).click();

    const sheet = page.getByRole("dialog", { name: "Filter wilayah" });
    await sheet.getByRole("combobox", { name: "Provinsi" }).selectOption({ label: "Jawa Barat" });
    await sheet
      .getByRole("combobox", { name: "Kabupaten / Kota" })
      .selectOption({ label: "Kota Depok" });
    await sheet.getByRole("button", { name: "Lihat hasil" }).click();

    await expect(sheet).toBeHidden();
    await expect(visibleText(page, "2 unit aktif di Kota Depok")).toBeVisible();
  });
});

test.describe("unit finder with location", () => {
  test.use({ geolocation: { latitude: -6.48, longitude: 106.85 }, permissions: ["geolocation"] });

  test("sorts by distance from the visitor", async ({ page }) => {
    await page.goto("/cek-unit?dekat=1");
    await page.getByRole("button", { name: "Gunakan lokasi saya" }).first().click();

    await expect(page).toHaveURL(/lat=-6\.480&lng=106\.850/);
    await expect(visibleText(page, "Diurutkan dari yang terdekat")).toBeVisible();
    await expect(unitCards(page).first()).toContainText("Unit Cibinong");
    await expect(unitCards(page).first()).toContainText("km");
  });
});
