import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

import { e2eUsers, signIn } from "./auth-users";

/*
 * Phase 4e: the media library. Uploads go to the storage the server uses: the local `.storage/`
 * driver in CI (no R2 variables). Desktop only, and the spec deletes what it uploads.
 */

test.skip(({ isMobile }) => isMobile, "uploads shared data: desktop only");
test.slow();

async function signInTo(page: Page, path: string, email: string) {
  await page.goto(`/admin/masuk?next=${encodeURIComponent(path)}`);
  await signIn(page, email);
  await expect(page).toHaveURL(new RegExp(`${path.replace("?", "\\?")}$`));
  await page.waitForLoadState("networkidle");
}

/** A real photo-sized JPEG, larger than the stored maximum so it gets scaled down. */
const photo = () =>
  sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#3a8a8f" } })
    .jpeg()
    .toBuffer();

test.describe("admin media", () => {
  test("uploads, renames and deletes an image", async ({ page }, testInfo) => {
    await signInTo(page, "/admin/media", e2eUsers(testInfo.project.name).admin.email);
    const name = `Uji Media ${Date.now() % 100000}`;

    await page.locator("input[type=file]").setInputFiles([
      { name: `${name}.jpg`, mimeType: "image/jpeg", buffer: await photo() },
      { name: "animasi.gif", mimeType: "image/gif", buffer: Buffer.from("GIF89a") },
    ]);
    // The wrong type is refused before any upload; the photo is scaled to 2400 px and stored.
    await expect(
      page.getByText("Format tidak didukung. Gunakan JPG, PNG, atau WebP."),
    ).toBeVisible();
    await expect(page.getByText("Selesai · 2400 × 1600 px")).toBeVisible();
    await expect(page.getByRole("progressbar", { name: `${name}.jpg` })).toHaveAttribute(
      "aria-valuenow",
      "100",
    );

    // The grid refreshes with the new image; open it from the library.
    const library = page.getByRole("region", { name: "Pustaka gambar" });
    await library.getByRole("searchbox", { name: "Cari gambar" }).fill(name);
    await library.getByRole("button", { name: "Cari" }).click();
    await expect(library.getByText("1 gambar")).toBeVisible();
    await library.getByRole("link", { name: new RegExp(name) }).click();
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(page.getByText("Belum dipakai di mana pun, jadi aman dihapus.")).toBeVisible();
    await page.waitForLoadState("networkidle");

    const renamed = `${name} baru`;
    await page.getByRole("textbox", { name: "Nama" }).fill(renamed);
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page.getByText("Nama gambar tersimpan.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: renamed })).toBeVisible();

    await page.getByRole("button", { name: "Hapus gambar" }).click();
    await page
      .getByRole("alertdialog", { name: `Hapus ${renamed}?` })
      .getByRole("button", { name: "Hapus gambar" })
      .click();
    await expect(page.getByText("Gambar dihapus.")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/media$/);
    await page.goto(`/admin/media?q=${encodeURIComponent(renamed)}`);
    await expect(page.getByText("Tidak ada gambar yang cocok dengan saringan ini.")).toBeVisible();
  });

  test("keeps images that are in use", async ({ page }, testInfo) => {
    await signInTo(page, "/admin/media?q=level-kindy", e2eUsers(testInfo.project.name).admin.email);
    await page.getByRole("link", { name: /level-kindy/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "level-kindy" })).toBeVisible();
    const usages = page.getByRole("region", { name: "Dipakai di" });
    await expect(usages.getByRole("link", { name: /Kindy/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Hapus gambar" })).toHaveCount(0);
  });

  test("offers uploading from the image picker of a form", async ({ page }, testInfo) => {
    await signInTo(page, "/admin/kegiatan/baru", e2eUsers(testInfo.project.name).admin.email);
    await page.getByRole("button", { name: "Pilih gambar" }).click();
    const dialog = page.getByRole("dialog", { name: "Pustaka media" });
    await dialog.getByRole("button", { name: "Unggah gambar baru" }).click();
    await expect(dialog.getByRole("button", { name: "Pilih file" })).toBeVisible();
    await dialog.getByRole("button", { name: "Kembali ke pustaka" }).click();
    await expect(dialog.getByRole("radiogroup", { name: "Pustaka media" })).toBeVisible();
  });
});
