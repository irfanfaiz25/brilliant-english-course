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
  await page.getByRole("button", { name: "Cari" }).click();
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
  });

  test("exports the filtered list as CSV", async ({ page }, testInfo) => {
    await signInTo(page, "/admin/calon-mitra", e2eUsers(testInfo.project.name).admin.email);
    await page.getByRole("searchbox", { name: "Cari calon mitra" }).fill(e2eLead.reference);
    await page.getByRole("button", { name: "Cari" }).click();
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
