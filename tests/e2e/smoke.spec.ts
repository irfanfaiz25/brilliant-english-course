import { expect, test } from "@playwright/test";

test("home page renders with the site identity", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Brilliant English Course/);
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
