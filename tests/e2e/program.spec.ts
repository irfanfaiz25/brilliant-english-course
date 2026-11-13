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
    for (const slug of ["kindy", "intro", "secondary", "kegiatan"]) {
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

  test("home links land on the matching level", async ({ page }) => {
    await page.goto("/program#intro");
    await expect(
      page.getByRole("navigation", { name: "Level program" }).getByRole("link", { name: /Intro/ }),
    ).toHaveAttribute("aria-current", "location");
    await expect(page.locator("#intro-title")).toBeInViewport();
  });

  test("activity cards on the program page are not self-links", async ({ page }) => {
    await page.goto("/program");
    await expect(page.locator("#kegiatan").getByRole("article")).toHaveCount(4);
    await expect(page.locator("#kegiatan").getByRole("link")).toHaveCount(0);
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
      name: "Perbandingan level Kindy, Intro, dan Secondary",
    });

    await expect(table.getByRole("columnheader")).toHaveCount(4);
    await expect(table.getByRole("rowheader", { name: "Usia" })).toBeVisible();
  });
});
