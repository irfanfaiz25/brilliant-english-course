import { expect, test, type Page } from "@playwright/test";

import { e2eUsers, signIn } from "../auth-users";

/*
 * Phase 4e: writing articles. Publishing changes what the public blog specs count, so this file
 * runs in the "publishing" project, after the desktop and mobile projects (playwright.config.ts).
 * It signs in with the desktop admin account and deletes what it creates.
 */

test.slow();

const admin = e2eUsers("desktop").admin;

async function signInTo(page: Page, path: string) {
  await page.goto(`/admin/masuk?next=${encodeURIComponent(path)}`);
  await signIn(page, admin.email);
  await page.waitForURL((url) => url.pathname === path);
  await page.waitForLoadState("networkidle");
}

/** Fills one language of the post form. */
async function fillTexts(page: Page, locale: "id" | "en", title: string) {
  const panel = page.locator(`[data-locale-panel="${locale}"]`);
  await panel.getByRole("textbox", { name: "Judul", exact: true }).fill(title);
  await panel.getByRole("textbox", { name: "Teks alternatif sampul" }).fill("Anak belajar");
  await panel
    .getByRole("textbox", { name: "Ringkasan" })
    .fill("Ringkasan artikel uji E2E untuk editor blog BEC.");
  return panel;
}

async function deleteFromList(page: Page, title: string) {
  await page.goto("/admin/blog");
  await page.getByRole("searchbox", { name: "Cari artikel" }).fill(title);
  await expect(page).toHaveURL(/[?&]q=/);
  await page
    .getByRole("button", { name: `Hapus ${title}` })
    .first()
    .click();
  await page
    .getByRole("alertdialog", { name: `Hapus ${title}?` })
    .getByRole("button", { name: "Hapus artikel" })
    .click();
  await expect(page.getByText("Artikel dihapus.")).toBeVisible();
}

test.describe("admin blog", () => {
  test("writes an article with the editor, publishes and deletes it", async ({ page }) => {
    await signInTo(page, "/admin/blog/tulis");
    const title = `Uji Blog E2E ${Date.now() % 100000}`;
    const slug = title.toLowerCase().replaceAll(" ", "-");

    const panel = await fillTexts(page, "id", title);
    // The slug follows the title until it is edited.
    await expect(panel.getByRole("textbox", { name: "Slug halaman" })).toHaveValue(slug);

    const bar = panel.getByRole("toolbar", { name: "Format teks" });
    await panel.getByRole("textbox", { name: "Isi artikel (ID)" }).click();
    await bar.getByRole("button", { name: "Heading 2" }).click();
    await page.keyboard.type("Bagian pertama");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Kalimat dengan kata ");
    // Bold on, type, bold off: the toolbar toggles the mark at the caret.
    const bold = bar.getByRole("button", { name: "Tebal" });
    await bold.click();
    await expect(bold).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.type("penting");
    await bold.click();
    await expect(bold).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("Enter");
    await bar.getByRole("button", { name: "Daftar berpoin" }).click();
    await page.keyboard.type("Poin satu");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    // Formatting stored as attributes: heading level, alignment and a link.
    await bar.getByRole("button", { name: "Heading 3" }).click();
    await page.keyboard.type("Sub bagian");
    await page.keyboard.press("Enter");
    await bar.getByRole("button", { name: "Rata tengah" }).click();
    await page.keyboard.type("Teks di tengah ");
    await bar.getByRole("button", { name: "Tautan" }).click();
    const linkDialog = page.getByRole("dialog", { name: "Tautan" });
    await linkDialog.getByRole("textbox", { name: "Alamat tautan" }).fill("bec.id/kemitraan");
    await linkDialog.getByRole("button", { name: "Terapkan" }).click();
    await page.keyboard.press("Enter");

    await bar.getByRole("button", { name: "Video YouTube" }).click();
    const video = page.getByRole("dialog", { name: "Video YouTube" });
    await video.getByRole("textbox", { name: "Alamat video" }).fill("https://vimeo.com/1");
    await video.getByRole("button", { name: "Sisipkan" }).click();
    await expect(video.getByText("Alamat ini bukan video YouTube.")).toBeVisible();
    await video.getByRole("textbox", { name: "Alamat video" }).fill("https://youtu.be/dQw4w9WgXcQ");
    await video.getByRole("button", { name: "Sisipkan" }).click();

    await bar.getByRole("button", { name: "Sisipkan tabel" }).click();
    await page.keyboard.type("Kolom A");

    // Pasted HTML keeps what the editor supports and drops scripts and unsafe links.
    await bar.getByRole("button", { name: "Impor HTML" }).click();
    const importDialog = page.getByRole("dialog", { name: "Impor HTML" });
    await importDialog
      .getByRole("textbox", { name: "Kode HTML" })
      .fill('<p>Dari HTML <script>alert(1)</script><a href="javascript:alert(1)">tautan</a></p>');
    await importDialog.getByRole("button", { name: "Impor" }).click();
    await expect(panel.getByText(/ kata$/)).not.toHaveText("0 kata");

    await page.getByRole("button", { name: "Pilih gambar" }).click();
    const library = page.getByRole("dialog", { name: "Pustaka media" });
    await library.getByRole("radio").first().click();
    await library.getByRole("button", { name: "Pakai gambar ini" }).click();
    await page.getByRole("textbox", { name: "Peran penulis" }).fill("Tim E2E");
    await page.getByRole("combobox", { name: "Status" }).selectOption("published");
    await page.getByRole("button", { name: "Tulis artikel" }).click();
    await expect(page).toHaveURL(/\/admin\/blog\/[0-9a-f-]{36}$/);

    try {
      await page.goto(`/blog/${slug}`);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      const article = page.getByRole("main");
      await expect(
        article.getByRole("heading", { level: 2, name: "Bagian pertama" }),
      ).toBeVisible();
      await expect(article.locator("strong", { hasText: "penting" })).toBeVisible();
      await expect(article.getByRole("heading", { level: 3, name: "Sub bagian" })).toBeVisible();
      await expect(article.locator("p.text-center", { hasText: "Teks di tengah" })).toBeVisible();
      await expect(article.getByRole("link", { name: "https://bec.id/kemitraan" })).toHaveAttribute(
        "href",
        "https://bec.id/kemitraan",
      );
      await expect(article.getByRole("table")).toContainText("Kolom A");
      await expect(
        article.locator('iframe[src^="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"]'),
      ).toHaveCount(1);
      await expect(article.locator('a[href^="javascript"]')).toHaveCount(0);
      await expect(article.getByText("Dari HTML")).toBeVisible();

      // No English version: the English URL leads to the English blog index.
      await page.goto(`/en/blog/${slug}`);
      await expect(page).toHaveURL(/\/en\/blog$/);
      // …where it is not listed (no Indonesian text shown as English).
      await expect(page.getByRole("main").getByText(title)).toHaveCount(0);
    } finally {
      await deleteFromList(page, title);
    }
    await page.goto(`/blog/${slug}`);
    await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
  });

  test("keeps drafts off the site and asks for a complete English version", async ({ page }) => {
    await signInTo(page, "/admin/blog/tulis");
    const title = `Draf E2E ${Date.now() % 100000}`;
    const panel = await fillTexts(page, "id", title);
    await panel.getByRole("textbox", { name: "Isi artikel (ID)" }).click();
    await page.keyboard.type("Isi draf.");
    await page.getByRole("button", { name: "Pilih gambar" }).click();
    const library = page.getByRole("dialog", { name: "Pustaka media" });
    await library.getByRole("radio").first().click();
    await library.getByRole("button", { name: "Pakai gambar ini" }).click();
    await page.getByRole("textbox", { name: "Peran penulis" }).fill("Tim E2E");

    // A started English version must be complete; the EN tab shows where the problem is.
    await page.getByRole("tab", { name: /English/ }).click();
    await page
      .locator('[data-locale-panel="en"]')
      .getByRole("textbox", { name: "Judul", exact: true })
      .fill("Draft in English");
    await page.getByRole("button", { name: "Tulis artikel" }).click();
    await expect(
      page.getByText("Lengkapi kolom ini atau kosongkan semua kolom versi Inggris.").first(),
    ).toBeVisible();
    await page.getByRole("button", { name: "Kosongkan versi Inggris" }).click();
    await page.getByRole("button", { name: "Tulis artikel" }).click();
    await expect(page).toHaveURL(/\/admin\/blog\/[0-9a-f-]{36}$/);

    try {
      await page.goto(`/blog/${title.toLowerCase().replaceAll(" ", "-")}`);
      await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
    } finally {
      await deleteFromList(page, title);
    }
  });
});
