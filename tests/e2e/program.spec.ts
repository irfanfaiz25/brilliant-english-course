import { expect, test, type Page } from "@playwright/test";

async function structuredData(page: Page) {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  return scripts.map((text) => JSON.parse(text) as { "@type": string; [key: string]: unknown });
}

test.describe("program page", () => {
  test("renders the header, breadcrumb and one section per level", async ({ page }) => {
    await page.goto("/program");

    await expect(page.getByRole("heading", { level: 1, name: "Program BEC" })).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Jejak navigasi" })
        .getByRole("link", { name: "Program" }),
    ).toHaveAttribute("aria-current", "page");
    for (const slug of ["kindy", "elementary", "secondary", "kegiatan"]) {
      await expect(page.locator(`#${slug}`)).toBeAttached();
    }
  });

  test("publishes Course, BreadcrumbList and FAQPage structured data", async ({ page }) => {
    await page.goto("/program");
    const data = await structuredData(page);

    expect(data.filter((item) => item["@type"] === "Course")).toHaveLength(3);
    expect(data.some((item) => item["@type"] === "BreadcrumbList")).toBe(true);
    expect(data.find((item) => item["@type"] === "FAQPage")?.mainEntity).toHaveLength(4);
  });

  test("level tabs jump to a level and follow the scroll position", async ({ page }) => {
    await page.goto("/program");
    const tabs = page.getByRole("navigation", { name: "Level program" });

    await tabs.getByRole("link", { name: /Secondary/ }).click();
    await expect(page).toHaveURL(/#secondary$/);
    await expect(tabs.getByRole("link", { name: /Secondary/ })).toHaveAttribute(
      "aria-current",
      "location",
    );

    await page.locator("#kindy").scrollIntoViewIfNeeded();
    await page.evaluate(() => document.getElementById("kindy")?.scrollIntoView({ block: "start" }));
    await expect(tabs.getByRole("link", { name: /Kindy/ })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  test("jumping between levels never flashes the levels in between", async ({ page }) => {
    await page.goto("/program#elementary");
    const tabs = page.getByRole("navigation", { name: "Level program" });
    await expect(tabs.getByRole("link", { name: /Elementary/ })).toHaveAttribute(
      "aria-current",
      "location",
    );

    // Record every tab that becomes current while the page scrolls to Secondary.
    await page.evaluate(() => {
      const seen: string[] = [];
      (window as unknown as { __seen: string[] }).__seen = seen;
      new MutationObserver(() => {
        const current = document.querySelector('[aria-current="location"]')?.getAttribute("href");
        if (current && seen.at(-1) !== current) seen.push(current);
      }).observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-current"],
      });
    });
    await tabs.getByRole("link", { name: /Secondary/ }).click();
    await page.waitForTimeout(1600);

    const seen = await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen);
    expect(seen).toEqual(["#secondary"]);
  });

  test("home links land on the matching level", async ({ page }) => {
    await page.goto("/program#elementary");
    await expect(
      page
        .getByRole("navigation", { name: "Level program" })
        .getByRole("link", { name: /Elementary/ }),
    ).toHaveAttribute("aria-current", "location");
    await expect(page.locator("#elementary-title")).toBeInViewport();
  });

  test("an activity card opens its detail popup, and back closes it", async ({ page }) => {
    await page.goto("/program");
    const activities = page.locator("#kegiatan");
    await expect(activities.getByRole("article")).toHaveCount(4);

    await activities.getByRole("link", { name: /Market Day/ }).click();
    const dialog = page.getByRole("dialog", { name: "Market Day" });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/program\?kegiatan=market-day$/);
    await expect(dialog.getByRole("heading", { name: "Yang dilakukan anak" })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Cek unit terdekat" })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Tanya via WhatsApp" })).toHaveAttribute(
      "href",
      /wa\.me\/\d+\?text=.*Market\+Day/,
    );

    await page.goBack();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/program$/);
  });

  test("a shared activity link opens the popup and closing keeps the page", async ({ page }) => {
    await page.goto("/program?kegiatan=book-day");
    const dialog = page.getByRole("dialog", { name: "Book Day" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Foto 2" }).click();
    await expect(dialog.getByRole("button", { name: "Foto 2" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/program$/);
  });

  test("English program page uses its localized URL", async ({ page }) => {
    await page.goto("/en/programs");

    await expect(page).toHaveTitle(/English Programs for Kids/);
    await expect(page.getByRole("heading", { level: 1, name: "BEC Programs" })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/en\/programs$/);
  });
});

test.describe("program comparison", () => {
  test("is a table on wide screens", async ({ page, isMobile }) => {
    test.skip(isMobile, "table is desktop-only");
    await page.goto("/program");
    const table = page.getByRole("table", {
      name: "Perbandingan level Kindy Class, Elementary Level, dan Secondary Level",
    });

    await expect(table.getByRole("columnheader")).toHaveCount(4);
    await expect(table.getByRole("rowheader", { name: "Usia" })).toBeVisible();
    await expect(table.getByRole("row", { name: /^Kelas/ })).toContainText(
      "Smart Kindy 3 → Intro 1 → Intro 2",
    );
  });
});
