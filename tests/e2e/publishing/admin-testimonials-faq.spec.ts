import { expect, test, type Page } from "@playwright/test";

import { e2eUsers, signIn } from "../auth-users";

/*
 * Phase 4f: testimonials and FAQ. Both change what the public specs count (testimonial cards,
 * FAQPage entries), so this file runs in the "publishing" project after the desktop and mobile
 * projects (playwright.config.ts). It signs in with the desktop admin and deletes what it adds.
 */

test.slow();

const admin = e2eUsers("desktop").admin;

async function signInTo(page: Page, path: string) {
  await page.goto(`/admin/masuk?next=${encodeURIComponent(path)}`);
  await signIn(page, admin.email);
  await page.waitForURL((url) => `${url.pathname}${url.search}` === path);
  await page.waitForLoadState("networkidle");
}

const panel = (page: Page, locale: "id" | "en") => page.locator(`[data-locale-panel="${locale}"]`);

test.describe("admin testimonials", () => {
  test("adds a partner testimonial, orders, hides and deletes it", async ({ page }) => {
    const name = `Mitra E2E ${Date.now() % 100000}`;
    const quote = `Cerita uji ${name}: modulnya lengkap dan timnya sigap membantu.`;
    const quoteEn = `Test story by ${name}: complete modules and a helpful team.`;
    await signInTo(page, "/admin/testimoni?audience=partner");

    // "Add" opens the form for the group on screen.
    await page.getByRole("link", { name: "Tambah testimoni" }).click();
    await expect(page).toHaveURL(/\/admin\/testimoni\/baru\?audience=partner$/);
    await expect(page.getByRole("combobox", { name: "Tampil untuk" })).toHaveValue("partner");

    await page.getByRole("textbox", { name: "Nama" }).fill(name);
    await page.getByRole("radio", { name: "4 bintang" }).check({ force: true });
    // Both languages are required: the English tab shows where the problem is.
    await panel(page, "id").getByRole("textbox", { name: "Kutipan" }).fill(quote);
    await panel(page, "id")
      .getByRole("textbox", { name: "Keterangan" })
      .fill("Mitra uji · Kab. Bogor");
    await page.getByRole("button", { name: "Tambah testimoni" }).click();
    await expect(panel(page, "en").getByText("Minimal 20 karakter.")).toBeVisible();
    await panel(page, "en").getByRole("textbox", { name: "Kutipan" }).fill(quoteEn);
    await panel(page, "en")
      .getByRole("textbox", { name: "Keterangan" })
      .fill("Test partner · Bogor");
    // The live preview shows the card as it will look.
    await expect(page.getByText(quoteEn)).toBeVisible();
    await page.getByRole("button", { name: "Tambah testimoni" }).click();

    // Back on the partner list, at the end.
    await expect(page).toHaveURL(/\/admin\/testimoni\?audience=partner$/);
    // The ordered list itself, not the filter chips above it.
    const rows = page.getByRole("main").locator("ol").getByRole("listitem");
    await expect(rows.last()).toContainText(name);

    try {
      // Moving up swaps it with the row above.
      await page.getByRole("button", { name: `Naikkan testimoni ${name}` }).click();
      await expect(rows.nth((await rows.count()) - 2)).toContainText(name);

      await page.goto("/kemitraan");
      await expect(page.getByText(quote)).toBeVisible();
      await page.goto("/en/partnership");
      await expect(page.getByText(quoteEn)).toBeVisible();

      // Hidden testimonials leave the site.
      await page.goto("/admin/testimoni?audience=partner");
      const show = page.getByRole("switch", { name: `Tampilkan testimoni ${name} di situs` });
      await show.click();
      await expect(show).toHaveAttribute("aria-checked", "false");
      await page.goto("/kemitraan");
      await expect(page.getByText(quote)).toHaveCount(0);
    } finally {
      await page.goto("/admin/testimoni?audience=partner");
      await page.getByRole("button", { name: `Hapus testimoni ${name}` }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Hapus testimoni" }).click();
      await expect(page.getByText("Testimoni dihapus.")).toBeVisible();
    }
    await expect(page.getByRole("main").getByText(name)).toHaveCount(0);
  });
});

test.describe("admin FAQ", () => {
  test("adds a program question, edits it and deletes it", async ({ page }) => {
    const question = `Pertanyaan uji E2E ${Date.now() % 100000}?`;
    const edited = `${question.slice(0, -1)} (diubah)?`;
    await signInTo(page, "/admin/faq?topic=program");

    await page.getByRole("link", { name: "Tambah pertanyaan" }).click();
    await expect(page).toHaveURL(/\/admin\/faq\/baru\?topic=program$/);
    await expect(page.getByRole("combobox", { name: "Topik" })).toHaveValue("program");

    await panel(page, "id").getByRole("textbox", { name: "Pertanyaan" }).fill(question);
    await panel(page, "id")
      .getByRole("textbox", { name: "Jawaban" })
      .fill("Baris pertama jawaban uji.\nBaris kedua jawaban uji.");
    await page.getByRole("tab", { name: /English/ }).click();
    await panel(page, "en")
      .getByRole("textbox", { name: "Pertanyaan" })
      .fill("An E2E test question?");
    await panel(page, "en")
      .getByRole("textbox", { name: "Jawaban" })
      .fill("A test answer that is long enough.");
    await page.getByRole("button", { name: "Tambah pertanyaan" }).click();

    await expect(page).toHaveURL(/\/admin\/faq\?topic=program$/);
    await expect(page.getByRole("main").locator("ol").getByRole("listitem").last()).toContainText(
      question,
    );

    try {
      // The answer keeps its line break on the site.
      await page.goto("/program");
      await page.getByRole("button", { name: question }).click();
      const answer = page.getByText("Baris pertama jawaban uji.");
      await expect(answer).toBeVisible();
      await expect(answer).toHaveCSS("white-space", "pre-line");

      await page.goto("/admin/faq?topic=program");
      await page.getByRole("link", { name: `Ubah pertanyaan: ${question}` }).click();
      await expect(page.getByRole("heading", { level: 1, name: "Ubah pertanyaan" })).toBeVisible();
      await panel(page, "id").getByRole("textbox", { name: "Pertanyaan" }).fill(edited);
      await page.getByRole("button", { name: "Simpan perubahan" }).click();
      await expect(page.getByText("Perubahan tersimpan dan sudah tampil di situs.")).toBeVisible();

      await page.goto("/program");
      await expect(page.getByRole("button", { name: edited })).toBeVisible();
    } finally {
      await page.goto("/admin/faq?topic=program");
      const row = page
        .getByRole("main")
        .locator("ol")
        .getByRole("listitem")
        .filter({ hasText: "Pertanyaan uji E2E" });
      await row.getByRole("button", { name: /^Hapus pertanyaan/ }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Hapus pertanyaan" }).click();
      await expect(page.getByText("Pertanyaan dihapus.")).toBeVisible();
    }
    await page.goto("/program");
    await expect(page.getByRole("button", { name: edited })).toHaveCount(0);
  });
});
