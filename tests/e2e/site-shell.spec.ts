import { expect, test } from "@playwright/test";

test.describe("site shell", () => {
  test("skip link is the first stop and moves focus to main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const skip = page.getByRole("link", { name: "Langsung ke konten" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("header elevates after scrolling", async ({ page }) => {
    await page.goto("/en/this-page-does-not-exist");
    const header = page.locator("#site-header");
    await expect(header).toHaveAttribute("data-scrolled", "false");

    await page.mouse.wheel(0, 600);
    await expect(header).toHaveAttribute("data-scrolled", "true");
  });

  test("footer links to the main sections and WhatsApp", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");

    await expect(footer.getByRole("link", { name: "Kemitraan" })).toHaveAttribute(
      "href",
      "/kemitraan",
    );
    await expect(footer.getByRole("link", { name: "Chat WhatsApp" })).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/62\d+\?text=/,
    );
  });

  test("404 keeps the site frame and offers ways back", async ({ page }) => {
    await page.goto("/en/this-page-does-not-exist");

    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: "Back to home" }),
    ).toHaveAttribute("href", "/en");
  });
});

test.describe("site shell on desktop", () => {
  test.skip(({ isMobile }) => isMobile, "desktop navigation only");

  test("primary navigation uses localized URLs", async ({ page }) => {
    await page.goto("/en");
    const nav = page.getByRole("navigation", { name: "Main navigation" });

    await expect(nav.getByRole("link", { name: "Partnership" })).toHaveAttribute(
      "href",
      "/en/partnership",
    );
    await expect(nav.getByRole("link", { name: "Find a Unit" })).toHaveAttribute(
      "href",
      "/en/find-a-unit",
    );
    await expect(page.getByRole("link", { name: "Become a Partner" })).toBeVisible();
  });
});

test.describe("site shell on mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile navigation only");

  test("menu sheet opens, lists sections and closes with Escape", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Buka menu" }).click();

    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu.getByRole("link", { name: "Program" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("action bar offers find-a-unit and WhatsApp", async ({ page }) => {
    await page.goto("/");
    const bar = page.getByRole("region", { name: "Aksi cepat" });

    await expect(bar.getByRole("link", { name: "Cek Unit" })).toHaveAttribute("href", "/cek-unit");
    await expect(bar.getByRole("link", { name: "Chat WA" })).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\//,
    );
  });
});
