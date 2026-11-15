import { expect, test, type Page } from "@playwright/test";

import { e2eUsers, signIn } from "./auth-users";

/*
 * ADR-041: the Kemitraan page content edited in admin. Saving changes shared data the partnership
 * spec reads, so this runs on the desktop project only and puts the copy back before it ends.
 */

test.skip(({ isMobile }) => isMobile, "saves shared data: desktop only");
test.slow();

async function openEditor(page: Page, email: string) {
  await page.goto(`/admin/masuk?next=${encodeURIComponent("/admin/halaman-kemitraan")}`);
  await signIn(page, email);
  await expect(page).toHaveURL(/\/admin\/halaman-kemitraan$/);
  // Forms must be hydrated before typing, or React Hook Form misses the change.
  await page.waitForLoadState("networkidle");
}

const saved = (page: Page) =>
  expect(page.getByText("Perubahan tersimpan dan sudah tampil di situs.")).toBeVisible();

test.describe("admin Kemitraan page", () => {
  test("edits a benefit, shows it on the site and refuses a bad investment", async ({
    page,
  }, testInfo) => {
    await openEditor(page, e2eUsers(testInfo.project.name).admin.email);
    const benefits = page.getByRole("region", { name: "Keuntungan" });
    const original = "Tanpa bagi hasil";
    const changed = `Tanpa bagi hasil ${Date.now() % 10000}`;

    // The row header reads "<position> <title>"; the delete button has its own name.
    const row = (title: string) => new RegExp(`^\\d+\\s*${title}$`);
    await benefits.getByRole("button", { name: row(original) }).click();
    const title = benefits.getByLabel(/^Judul/).first();
    await title.fill(changed);
    await benefits.getByRole("button", { name: "Simpan perubahan" }).click();
    await saved(page);

    try {
      await page.goto("/kemitraan");
      await expect(
        page.getByRole("list", { name: "Keunggulan kemitraan" }).getByText(changed),
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: changed })).toBeVisible();
    } finally {
      await page.goto("/admin/halaman-kemitraan");
      await page.waitForLoadState("networkidle");
      const panel = page.getByRole("region", { name: "Keuntungan" });
      await panel.getByRole("button", { name: row(changed) }).click();
      await panel
        .getByLabel(/^Judul/)
        .first()
        .fill(original);
      await panel.getByRole("button", { name: "Simpan perubahan" }).click();
      await saved(page);
    }

    // The investment takes digits only (or nothing, to keep it for the consultation).
    const kit = page.getByRole("region", { name: "Starter Kit & investasi" });
    await kit.getByLabel(/^Investasi awal/).fill("7,5 juta");
    await kit.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(kit.getByText("Isi angka rupiah tanpa titik, atau kosongkan.")).toBeVisible();
  });
});
