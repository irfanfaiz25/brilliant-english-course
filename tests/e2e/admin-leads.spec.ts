import { readFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

import { e2eLead, e2eUsers, signIn } from "./auth-users";

/*
 * Phase 4d: the partner leads pipeline. The spec works on one fixture lead (`e2eLead`) that the
 * global setup resets to a fresh application, so it never changes seed leads or what a public spec
 * reads. Saving changes shared data: desktop project only.
 */

test.skip(({ isMobile }) => isMobile, "saves shared data: desktop only");
test.slow();

async function signInTo(page: Page, path: string, email: string) {
  await page.goto(`/admin/masuk?next=${encodeURIComponent(path)}`);
  await signIn(page, email);
  await expect(page).toHaveURL(new RegExp(`${path.replace("?", "\\?")}$`));
  // Forms must be hydrated before typing, or React Hook Form misses the change.
  await page.waitForLoadState("networkidle");
}

async function openFixture(page: Page) {
  await page.getByRole("searchbox", { name: "Cari calon mitra" }).fill(e2eLead.reference);
  // Results follow the typing; no button.
  await expect(page).toHaveURL(/[?&]q=MTR-E2E-0001/);
  await page.getByRole("main").getByRole("link", { name: e2eLead.name }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: e2eLead.name })).toBeVisible();
  await page.waitForLoadState("networkidle");
}

test.describe("admin leads", () => {
  test("works a lead through the pipeline and holds a quota slot", async ({ page }, testInfo) => {
    const admin = e2eUsers(testInfo.project.name).admin;
    await signInTo(page, "/admin/calon-mitra", admin.email);
    await openFixture(page);

    const history = page.getByRole("region", { name: "Catatan & riwayat" });
    await expect(history).toContainText("Mendaftar lewat halaman Kemitraan");

    // Persiapan reserves a slot in the lead's village, together with the assignee and a note.
    await page.getByLabel(/^Status/).selectOption({ label: "Persiapan" });
    await page.getByLabel("Petugas").selectOption({ label: `${admin.name} (${admin.email})` });
    await page.getByLabel("Catatan perubahan").fill("Survei lokasi selesai.");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByText("Perubahan tersimpan.")).toBeVisible();
    await expect(
      page.getByText("Satu slot kuota desa dipesan untuk calon mitra ini."),
    ).toBeVisible();
    await expect(history).toContainText("Status: Baru → Persiapan");
    await expect(history).toContainText(`Ditugaskan ke ${admin.name}`);
    await expect(history).toContainText("Slot kuota desa dipesan");
    await expect(history).toContainText("Survei lokasi selesai.");

    // A separate follow-up note lands on top of the history.
    await page.getByLabel("Catatan baru").fill("Mitra minta jadwal ulang.");
    await page.getByRole("button", { name: "Tambah catatan" }).click();
    await expect(page.getByText("Catatan tersimpan.")).toBeVisible();
    await expect(history.getByRole("blockquote").first()).toHaveText("Mitra minta jadwal ulang.");

    // Leaving Persiapan releases the slot.
    await page.getByLabel(/^Status/).selectOption({ label: "Dihubungi" });
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(history).toContainText("Status: Persiapan → Dihubungi");
    await expect(history).toContainText("Slot kuota desa dilepas");
    await expect(page.getByText("Satu slot kuota desa dipesan untuk calon mitra ini.")).toHaveCount(
      0,
    );

    // The lead is now in the "assigned to me" and "in progress" lists.
    await page.goto("/admin/calon-mitra");
    await page.getByRole("link", { name: "Ditugaskan ke saya" }).click();
    await expect(page).toHaveURL(/[?&]mine=1/);
    await page
      .getByRole("navigation", { name: "Saring status" })
      .getByRole("link", { name: /^Dihubungi/ })
      .click();
    await expect(
      page.getByRole("main").getByRole("link", { name: e2eLead.name }).first(),
    ).toBeVisible();

    // A unit created from the lead in Persiapan keeps the village slot until it is active
    // (ADR-039). Same test as above: the fixture lead must not be worked on in parallel.
    await page.goto("/admin/calon-mitra");
    await openFixture(page);
    await page.getByLabel(/^Status/).selectOption({ label: "Persiapan" });
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByText("Perubahan tersimpan.")).toBeVisible();
    await page.getByRole("link", { name: "Buat unit dari calon mitra ini" }).click();
    await expect(page).toHaveURL(/\/admin\/unit\/baru\?lead=/);
    await page.waitForLoadState("networkidle");
    // The page left behind may still be in the DOM (hidden): scope to the unit form.
    const unitStatus = page.getByRole("region", { name: "Identitas" }).getByLabel(/^Status/);

    const unitName = `Unit Uji Mitra ${Date.now() % 10000}`;
    await page.getByLabel(/^Nama unit/).fill(unitName);
    await page.getByLabel(/^Lintang/).fill("-6.55");
    await page.getByLabel(/^Bujur/).fill("106.95");
    await page.getByLabel("Kindy").check();
    await expect(unitStatus).toHaveValue("onboarding");
    await page.getByRole("button", { name: "Tambah unit" }).click();
    await expect(page.getByText("Perubahan tersimpan dan sudah tampil di situs.")).toBeVisible();
    // Back on the lead: converted, linked to the unit, the slot no longer held by the lead.
    await expect(page).toHaveURL(/\/admin\/calon-mitra\/[\w-]+$/);
    await expect(page.getByRole("link", { name: new RegExp(unitName) })).toBeVisible();
    await expect(page.getByText("Satu slot kuota desa dipesan untuk calon mitra ini.")).toHaveCount(
      0,
    );

    const unitRow = page.getByRole("main").getByRole("row").filter({ hasText: unitName });
    const heldByUnit = page.getByText(`Unit ${unitName} (persiapan)`);
    try {
      await page.goto("/admin/kuota");
      await expect(heldByUnit).toBeVisible();

      // Turning the unit active hands the slot to the unit itself.
      await page.goto("/admin/unit");
      await page.getByRole("main").getByRole("link", { name: unitName }).first().click();
      await page.waitForLoadState("networkidle");
      await unitStatus.selectOption({ label: "Aktif" });
      await page.getByRole("button", { name: "Simpan perubahan" }).click();
      await expect(page.getByText("Perubahan tersimpan dan sudah tampil di situs.")).toBeVisible();
      await page.goto("/admin/kuota");
      await expect(page.getByRole("heading", { name: "Pesanan slot" })).toBeVisible();
      await expect(heldByUnit).toHaveCount(0);
    } finally {
      await page.goto("/admin/unit");
      await page.waitForLoadState("networkidle");
      await unitRow.getByRole("button", { name: `Hapus ${unitName}` }).click();
      await page
        .getByRole("alertdialog", { name: `Hapus ${unitName}?` })
        .getByRole("button", { name: "Hapus unit" })
        .click();
      await expect(page.getByText("Unit dihapus.")).toBeVisible();
    }
  });

  test("exports the filtered list as CSV", async ({ page }, testInfo) => {
    await signInTo(page, "/admin/calon-mitra", e2eUsers(testInfo.project.name).admin.email);
    await page.getByRole("searchbox", { name: "Cari calon mitra" }).fill(e2eLead.reference);
    // Results follow the typing; no button.
    await expect(page).toHaveURL(/[?&]q=MTR-E2E-0001/);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Unduh CSV" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^calon-mitra-\d{4}-\d{2}-\d{2}\.csv$/);
    const csv = await readFile((await download.path()) ?? "", "utf8");
    const lines = csv.replace(/^﻿/, "").trim().split("\r\n");
    expect(lines[0]).toContain("Referensi");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain(e2eLead.reference);
  });
});
