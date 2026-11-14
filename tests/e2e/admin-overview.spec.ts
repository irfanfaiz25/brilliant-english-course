import { expect, test } from "@playwright/test";

import { e2eUsers, signIn } from "./auth-users";

/*
 * Phase 4h: Ringkasan. Read-only, so it runs on desktop and mobile. Counts depend on the data of
 * the run, so the checks are about structure: sections per role, the range in the URL, the
 * chart's keyboard tooltip and its table view.
 */

test.describe("admin overview", () => {
  test("shows a super admin the trend, pipeline, regions and activity", async ({
    page,
  }, testInfo) => {
    await page.goto("/admin/masuk");
    await signIn(page, e2eUsers(testInfo.project.name).admin.email);
    await expect(page.getByRole("heading", { level: 1, name: "Ringkasan" })).toBeVisible();

    for (const name of [
      "Perlu tindakan",
      "Tren calon mitra",
      "Pipeline calon mitra",
      "Peluang wilayah",
      "Calon mitra terbaru",
      "Aktivitas terbaru",
    ]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
    await expect(page.getByRole("main").getByRole("definition").first()).toBeVisible();

    // The range lives in the URL and keeps the page where it was.
    const trend = page.getByRole("region", { name: "Tren calon mitra" });
    await trend.getByRole("link", { name: "12 bulan" }).click();
    await expect(page).toHaveURL(/\/admin\?range=12m$/);
    await expect(trend.getByRole("link", { name: "12 bulan" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    // Keyboard: focusing the plot shows the latest period, arrows move it.
    const plot = trend.getByRole("group", { name: /Grafik tren calon mitra, 12 bulan/ });
    await plot.focus();
    const tooltip = trend.getByRole("status");
    await expect(tooltip).toContainText("Masuk");
    await expect(tooltip).toContainText("Jadi mitra");
    const latest = await tooltip.textContent();
    await page.keyboard.press("ArrowLeft");
    await expect(tooltip).not.toHaveText(latest ?? "");

    // Every value is also in a table: one row per month.
    await trend.getByText("Lihat sebagai tabel").click();
    await expect(trend.getByRole("table").getByRole("row")).toHaveCount(13);

    // A pipeline bar opens the list filtered to its status.
    await page
      .getByRole("region", { name: "Pipeline calon mitra" })
      .getByRole("link", { name: /^Baru:/ })
      .click();
    await expect(page).toHaveURL(/\/admin\/calon-mitra\?status=new$/);
  });

  test("shows an editor neither partner data nor the activity log", async ({ page }, testInfo) => {
    await page.goto("/admin/masuk");
    await signIn(page, e2eUsers(testInfo.project.name).editor.email);
    await expect(page.getByRole("heading", { level: 1, name: "Ringkasan" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Perlu tindakan" })).toBeVisible();
    for (const name of ["Tren calon mitra", "Pipeline calon mitra", "Aktivitas terbaru"]) {
      await expect(page.getByRole("heading", { level: 2, name })).toHaveCount(0);
    }
  });
});
