import { expect, test } from "@playwright/test";

test.describe("locale routing", () => {
  test("Indonesian is served at / with hreflang alternates", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("lang", "id");
    await expect(page.getByText("Kursus Bahasa Inggris Anak · Usia 4–15 tahun")).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /^https?:\/\/[^/]+\/?$/,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      "href",
      /\/en$/,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
  });

  test("the locale switcher moves between languages", async ({ page }) => {
    await page.goto("/");
    const switcher = page
      .getByRole("contentinfo")
      .getByRole("navigation", { name: "Ganti bahasa" });
    await switcher.getByRole("link", { name: "English" }).click();

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("English Courses for Kids · Ages 4–15")).toBeVisible();

    await page
      .getByRole("contentinfo")
      .getByRole("navigation", { name: "Change language" })
      .getByRole("link", { name: "Bahasa Indonesia" })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "id");
  });

  test("the default locale prefix redirects to the unprefixed URL", async ({ page }) => {
    await page.goto("/id");
    await expect(page).toHaveURL(/\/$/);
  });

  test("unknown paths render a translated 404", async ({ page }) => {
    const response = await page.goto("/en/this-page-does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});
