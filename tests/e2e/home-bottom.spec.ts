import { expect, test } from "@playwright/test";

test.describe("home page — bottom sections", () => {
  test("unit finder searches the Cek Unit page with a plain GET form", async ({ page }) => {
    await page.goto("/");
    const finder = page.getByRole("region", { name: "Temukan Unit BEC Terdekat di Daerahmu" });

    await finder.getByRole("searchbox", { name: "Cari unit" }).fill("Cibinong");
    await finder.getByRole("button", { name: "Cari Unit" }).click();
    await expect(page).toHaveURL(/\/cek-unit\?q=Cibinong$/);
  });

  test("unit cards offer WhatsApp and directions", async ({ page }) => {
    await page.goto("/");
    const card = page.getByRole("article").filter({ hasText: "Unit Sukamaju" });

    await expect(card.getByText("Senin – Sabtu · 14.00 – 18.00")).toBeAttached();
    await expect(card.getByRole("link", { name: "Chat WhatsApp" })).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/62\d+\?text=Halo\+Unit\+Sukamaju/,
    );
    await expect(card.getByRole("link", { name: "Lihat Rute" })).toHaveAttribute(
      "href",
      /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/,
    );
  });

  test("steps, partnership, testimonials and closing CTA render", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("region", { name: "Mulai Belajar dalam 3 Langkah" }).getByRole("tab"),
    ).toHaveCount(3);
    await expect(page.getByRole("link", { name: "Gabung Mitra" }).last()).toHaveAttribute(
      "href",
      "/kemitraan#daftar",
    );
    await expect(
      page.getByRole("region", { name: "Anak Jadi Berani Ngomong Inggris" }).getByRole("figure"),
    ).toHaveCount(3);
    await expect(
      page.getByRole("heading", { name: "Siap mulai belajar bahasa Inggris dengan seru?" }),
    ).toBeAttached();
  });

  test("join steps work as tabs with a live preview", async ({ page }) => {
    await page.goto("/");
    const steps = page.getByRole("tablist", { name: "Langkah pendaftaran" });
    const tabs = steps.getByRole("tab");
    const panel = page.getByRole("tabpanel");

    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(panel).toContainText("Admin BEC Cibinong");
    await expect(tabs.nth(1).getByText("Hubungi admin lewat WhatsApp")).toBeVisible();

    await page.keyboard.press("ArrowDown");
    await expect(tabs.nth(2)).toBeFocused();
    await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
    await expect(panel).toContainText("Hasil placement");
  });

  test("FAQ answers toggle and are published as FAQPage structured data", async ({ page }) => {
    await page.goto("/");
    const faq = page.getByRole("region", { name: "Yang Sering Ditanyakan Orang Tua" });
    const answer = faq.getByText("Ada placement test singkat");

    await expect(answer).toBeHidden();
    await faq.getByRole("button", { name: "Apakah ada tes sebelum mulai belajar?" }).click();
    await expect(answer).toBeVisible();

    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faqPage = jsonLd
      .map((text) => JSON.parse(text))
      .find((data) => data["@type"] === "FAQPage");
    expect(faqPage?.mainEntity).toHaveLength(5);
  });
});
