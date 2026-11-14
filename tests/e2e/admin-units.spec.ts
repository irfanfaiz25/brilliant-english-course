import { expect, test, type Page } from "@playwright/test";

import { e2eUsers, signIn } from "./auth-users";

/*
 * Phase 4c: units and quota. Saving changes shared data other specs read, so these tests run on
 * the desktop project only, never change what a public spec asserts (active units, the quota of
 * villages they check) and remove what they create.
 */

test.skip(({ isMobile }) => isMobile, "saves shared data: desktop only");
// Each test saves and then cleans up; leave room for both halves, even on a cold dev server.
test.slow();

async function signInTo(page: Page, path: string, email: string) {
  await page.goto(`/admin/masuk?next=${encodeURIComponent(path)}`);
  await signIn(page, email);
  await expect(page).toHaveURL(new RegExp(`${path.replace("?", "\\?")}$`));
  // Forms must be hydrated before typing, or React Hook Form misses the change.
  await page.waitForLoadState("networkidle");
}

const saved = (page: Page) =>
  expect(page.getByText("Perubahan tersimpan dan sudah tampil di situs.")).toBeVisible();

test.describe("admin units", () => {
  test("adds a unit, refuses a full village and deletes the unit", async ({ page }, testInfo) => {
    await signInTo(page, "/admin/unit/baru", e2eUsers(testInfo.project.name).admin.email);
    const name = `Unit Uji E2E ${Date.now() % 10000}`;

    await page.getByLabel(/^Nama unit/).fill(name);
    // The slug follows the name until it is edited.
    await expect(page.getByLabel(/^Slug halaman/)).toHaveValue(
      name.toLowerCase().replace("unit ", "").replaceAll(" ", "-"),
    );

    // Cibinong (32.01.01.1006) is full in the seed: one active unit and one reservation.
    await page.getByLabel("Provinsi").selectOption({ label: "Jawa Barat" });
    await page.getByLabel("Kabupaten / Kota").selectOption({ label: "Kab. Bogor" });
    await page.getByLabel("Kecamatan").selectOption({ label: "Cibinong" });
    await page.getByLabel(/^Desa \/ Kelurahan/).selectOption({ label: "Cibinong" });
    await page.getByLabel(/^Alamat lengkap/).fill("Jl. Uji E2E No. 1, Kel. Cibinong, Kab. Bogor");
    await page.getByLabel(/^Lintang/).fill("-6.4817");
    await page.getByLabel(/^Bujur/).fill("106.854");
    await page.getByLabel(/^Nama pengelola/).fill("Ibu Uji");
    await page.getByLabel(/^Nomor WhatsApp unit/).fill("0812-0000-9999");
    await page.getByLabel("Kindy").check();
    await expect(page.locator("[inert]")).toContainText(name);

    await page.getByLabel(/^Status/).selectOption({ label: "Aktif" });
    await page.getByRole("button", { name: "Tambah unit" }).click();
    await expect(page.getByText(/Kuota desa ini sudah penuh/)).toBeVisible();

    await page.getByLabel(/^Status/).selectOption({ label: "Persiapan" });
    await page.getByRole("button", { name: "Tambah unit" }).click();
    await saved(page);
    await expect(page).toHaveURL(/\/admin\/unit$/);

    const row = page.getByRole("main").getByRole("row").filter({ hasText: name });
    try {
      await expect(row).toContainText(/BEC-JB-\d{4}/);
      await expect(row).toContainText("Persiapan");

      await page.getByRole("searchbox", { name: "Cari unit" }).fill(name);
      await page.getByRole("button", { name: "Cari" }).click();
      await expect(page.getByRole("main").getByRole("row")).toHaveCount(2);
    } finally {
      await page.goto("/admin/unit");
      await page.waitForLoadState("networkidle");
      await row.getByRole("button", { name: `Hapus ${name}` }).click();
      await page
        .getByRole("alertdialog", { name: `Hapus ${name}?` })
        .getByRole("button", { name: "Hapus unit" })
        .click();
      await expect(page.getByText("Unit dihapus.")).toBeVisible();
    }
    await expect(page.getByRole("main").getByText(name)).toHaveCount(0);
  });
});

test.describe("admin quota", () => {
  test("checks a village, reserves a slot and releases it", async ({ page }, testInfo) => {
    // Singajaya (32.01.06.2003) is not used by any other spec.
    await signInTo(
      page,
      "/admin/kuota?desa=32.01.06.2003",
      e2eUsers(testInfo.project.name).admin.email,
    );
    const check = page.locator("#cek-desa");
    await expect(check.getByRole("heading", { name: "Singajaya" })).toBeVisible();
    await expect(check.getByText("Tersedia")).toBeVisible();

    // The "almost full" threshold must stay below the maximum.
    await page.getByLabel(/^Tampil "hampir penuh"/).fill("5");
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page.getByText(/harus lebih kecil dari maksimal unit per desa/)).toBeVisible();
    await page.reload();
    await page.waitForLoadState("networkidle");

    const note = `Uji E2E ${Date.now() % 10000}`;
    await check.getByRole("button", { name: "Pesan slot di desa ini" }).click();
    const sheet = page.getByRole("dialog", { name: "Pesan slot" });
    await expect(sheet.getByLabel(/^Desa \/ Kelurahan/)).toHaveValue("32.01.06.2003");
    await sheet.getByLabel("Catatan").fill(note);
    await sheet.getByRole("button", { name: "Pesan slot" }).click();
    await saved(page);

    try {
      await expect(check.getByText("Hampir penuh")).toBeVisible();
      await expect(check.getByText(note)).toBeVisible();
    } finally {
      await page.reload();
      await page.waitForLoadState("networkidle");
      await check.getByRole("button", { name: "Lepas pesanan Singajaya" }).click();
      await page
        .getByRole("alertdialog", { name: "Lepas pesanan di Singajaya?" })
        .getByRole("button", { name: "Lepas pesanan" })
        .click();
      await expect(page.getByText("Pesanan dilepas.")).toBeVisible();
    }
    await expect(check.getByText("Tersedia")).toBeVisible();
  });
});
