import { expect, test, type Page } from "@playwright/test";

import { levelFixtures } from "../../src/db/seed/content/programs";
import { e2eUsers, signIn } from "./auth-users";

/*
 * Phase 4b: programs and activities. Saving changes shared data other specs read, so these tests
 * run on the desktop project only, change what no other spec asserts (a level description, a
 * hidden activity) and put everything back before they finish.
 */

test.skip(({ isMobile }) => isMobile, "saves shared data: desktop only");
// Each test saves and then restores data; leave room for both halves, even on a cold dev server.
test.slow();

async function signInTo(page: Page, path: string, email: string) {
  await page.goto(`/admin/masuk?next=${encodeURIComponent(path)}`);
  await signIn(page, email);
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  // Forms must be hydrated before typing, or React Hook Form misses the change.
  await page.waitForLoadState("networkidle");
}

const saved = (page: Page) =>
  expect(page.getByText("Perubahan tersimpan dan sudah tampil di situs.")).toBeVisible();

test.describe("admin programs", () => {
  test("edits a level, blocks overlapping ages and publishes the copy", async ({
    page,
  }, testInfo) => {
    await signInTo(page, "/admin/program", e2eUsers(testInfo.project.name).admin.email);
    await page.getByRole("link", { name: "Ubah level Kindy" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Level Kindy" })).toBeVisible();
    await page.waitForLoadState("networkidle");

    // Kindy (4–6) may not reach into Intro (7–9).
    const ageMax = page.getByLabel(/^Usia maksimal/);
    await ageMax.fill("7");
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page.getByText("Rentang usia ini bertabrakan dengan level lain.")).toBeVisible();
    await ageMax.fill("6");

    // An empty English field: the form opens the English tab and focuses the field.
    const english = page.getByRole("tab", { name: /^English/ });
    await english.click();
    const englishName = page.getByRole("tabpanel", { name: /^English/ }).getByLabel(/^Nama level/);
    const originalName = await englishName.inputValue();
    await englishName.fill("");
    await page.getByRole("tab", { name: /^Indonesia/ }).click();
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(english).toHaveAttribute("aria-selected", "true");
    await expect(englishName).toBeFocused();
    await expect(english).toContainText("ada isian yang perlu diperbaiki");
    await englishName.fill(originalName);

    const description = page.getByRole("tabpanel", { name: /^Indonesia/ }).getByLabel(/^Deskripsi/);
    await page.getByRole("tab", { name: /^Indonesia/ }).click();
    // Restored to the seeded text, so a run that stopped halfway cannot leave its own text behind.
    const seeded = levelFixtures.id.find((level) => level.slug === "kindy")?.description ?? "";
    const e2eText = `Deskripsi uji E2E ${Date.now() % 10000}: anak belajar lewat lagu dan permainan.`;
    await description.fill(e2eText);
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await saved(page);

    try {
      await page.goto("/program");
      await expect(page.getByText(e2eText)).toBeVisible();
    } finally {
      await page.goto("/admin/program/kindy");
      await page.waitForLoadState("networkidle");
      const restore = page.getByRole("tabpanel", { name: /^Indonesia/ }).getByLabel(/^Deskripsi/);
      await expect(restore).toHaveValue(e2eText);
      await restore.fill(seeded);
      await page.getByRole("button", { name: "Simpan perubahan" }).click();
      await saved(page);
      await page.reload();
      await expect(restore).toHaveValue(seeded);
    }
  });

  test("asks before leaving a form with unsaved changes", async ({ page }, testInfo) => {
    await signInTo(page, "/admin/program/intro", e2eUsers(testInfo.project.name).admin.email);
    await page.getByLabel(/^Pertemuan per minggu/).fill("3");
    await page.getByRole("link", { name: "Semua level" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Tinggalkan halaman ini?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Batal" }).click();
    await expect(page).toHaveURL(/\/admin\/program\/intro$/);
    await expect(page.getByLabel(/^Pertemuan per minggu/)).toHaveValue("3");

    await page.getByRole("link", { name: "Semua level" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Tinggalkan" }).click();
    await expect(page).toHaveURL(/\/admin\/program$/);
  });
});

test.describe("admin activities", () => {
  test("adds, reorders, hides and deletes an activity", async ({ page }, testInfo) => {
    await signInTo(page, "/admin/kegiatan", e2eUsers(testInfo.project.name).admin.email);
    const name = `Kegiatan Uji E2E ${Date.now() % 10000}`;

    await page.getByRole("link", { name: "Tambah kegiatan" }).click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Pilih gambar" }).click();
    const library = page.getByRole("dialog", { name: "Pustaka media" });
    await library.getByRole("radio").first().click();
    await library.getByRole("button", { name: "Pakai gambar ini" }).click();
    // Hidden from the start: public specs count the published activities.
    await page.getByLabel("Tampilkan kegiatan ini di situs").uncheck();

    for (const [tab, values] of [
      [
        "Indonesia",
        [
          name,
          "Semua level",
          "Anak bermain peran dalam bahasa Inggris bersama teman.",
          "Anak bermain peran",
        ],
      ],
      [
        "English",
        [
          name,
          "All levels",
          "Children role-play in English together with friends.",
          "Children role-playing",
        ],
      ],
    ] as const) {
      await page.getByRole("tab", { name: new RegExp(`^${tab}`) }).click();
      const panel = page.getByRole("tabpanel", { name: new RegExp(`^${tab}`) });
      await panel.getByLabel(/^Nama kegiatan/).fill(values[0]);
      await panel.getByLabel(/^Untuk siapa/).fill(values[1]);
      await panel.getByLabel(/^Ringkasan/).fill(values[2]);
      await panel.getByLabel(/^Teks alternatif foto/).fill(values[3]);
    }
    await page.getByRole("button", { name: "Tambah kegiatan" }).click();
    await saved(page);
    await expect(page).toHaveURL(/\/admin\/kegiatan$/);

    const rows = page.getByRole("main").getByRole("listitem");
    const row = rows.filter({ hasText: name });
    try {
      await expect(rows.last()).toContainText(name);
      await expect(
        row.getByRole("switch", { name: `Tampilkan ${name} di situs` }),
      ).not.toBeChecked();

      // A fresh list: no refresh from the save in flight and no toast over the row actions.
      await page.reload();
      await page.waitForLoadState("networkidle");
      await row.getByRole("button", { name: `Naikkan ${name}` }).click();
      await expect(rows.last()).not.toContainText(name);

      await page.goto("/");
      await expect(page.getByRole("heading", { name })).toHaveCount(0);
    } finally {
      await page.goto("/admin/kegiatan");
      await page.waitForLoadState("networkidle");
      await row.getByRole("button", { name: `Hapus ${name}` }).click();
      const confirm = page.getByRole("alertdialog", { name: `Hapus ${name}?` });
      await confirm.getByRole("button", { name: "Hapus kegiatan" }).click();
      await expect(page.getByText("Kegiatan dihapus.")).toBeVisible();
    }
    await expect(page.getByRole("main").getByText(name)).toHaveCount(0);
  });
});
