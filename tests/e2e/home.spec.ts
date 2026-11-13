import { expect, test } from "@playwright/test";

test.describe("home page — top sections", () => {
  test("hero offers both journeys", async ({ page }) => {
    await page.goto("/");
    const hero = page.getByRole("region", { name: "A Fun Way to Learn English" });

    await expect(hero.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(hero.getByRole("link", { name: "Cek Unit Terdekat" })).toHaveAttribute(
      "href",
      "/cek-unit",
    );
    await expect(hero.getByRole("link", { name: "Pelajari kemitraan" })).toHaveAttribute(
      "href",
      "/kemitraan",
    );
  });

  test("age chips jump to and highlight the matching level", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "7–9 th — lihat level Intro" }).click();

    await expect(page).toHaveURL(/#level-intro$/);
    const card = page.locator("#level-intro");
    await expect(card).toBeInViewport();
    expect(await card.evaluate((el) => el.matches(":target"))).toBe(true);
  });

  test("stats expose their final numbers", async ({ page }) => {
    await page.goto("/");
    const stats = page.getByRole("region", { name: "BEC dalam angka" });

    await expect(stats).toMatchAriaSnapshot(`- definition: "128+"`);
    await expect(stats.getByText("Siswa belajar")).toBeVisible();
  });

  test("programs list three levels linking to their details", async ({ page }) => {
    await page.goto("/");
    const programs = page.getByRole("region", { name: "Tiga Level, Sesuai Usia Anak" });

    await expect(programs.getByRole("article")).toHaveCount(3);
    await expect(
      programs.getByRole("link", { name: "Lihat detail level" }).first(),
    ).toHaveAttribute("href", "/program#kindy");
  });

  test("activities show four cards", async ({ page }) => {
    await page.goto("/");
    const activities = page.getByRole("region", { name: "Belajar Lewat Pengalaman" });

    await expect(activities.getByRole("article")).toHaveCount(4);
    await expect(activities.getByRole("heading", { name: "Market Day" })).toBeAttached();
  });

  test("English home uses localized copy and URLs", async ({ page }) => {
    await page.goto("/en");

    await expect(page).toHaveTitle(/English Courses for Kids Aged 4–15/);
    await expect(page.getByRole("link", { name: "Find the Nearest Unit" }).first()).toHaveAttribute(
      "href",
      "/en/find-a-unit",
    );
    await expect(page.getByRole("link", { name: "See level details" }).first()).toHaveAttribute(
      "href",
      "/en/programs#kindy",
    );
  });
});
