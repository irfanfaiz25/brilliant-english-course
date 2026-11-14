import { expect, test, type Page } from "@playwright/test";

import { e2eUsers, signIn } from "./auth-users";

/*
 * Phase 4a: settings and SEO. Saving changes shared data that other specs read, so the saving
 * tests run on the desktop project only, touch values no other spec asserts (the office address,
 * the unit directory title) and put the previous value back before they finish.
 */

async function signInTo(page: Page, path: string, email: string) {
  await page.goto(`/admin/masuk?next=${encodeURIComponent(path)}`);
  await signIn(page, email);
  await expect(page).toHaveURL(new RegExp(`${path}$`));
}

async function save(page: Page, form: ReturnType<Page["locator"]>) {
  await form.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(page.getByText("Perubahan tersimpan dan sudah tampil di situs.")).toBeVisible();
}

test.describe("admin settings", () => {
  test("validates contact details and publishes a saved address", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "saves shared data: desktop only");
    await signInTo(page, "/admin/pengaturan", e2eUsers(testInfo.project.name).admin.email);

    const contact = page.locator("form").first();
    const whatsapp = contact.getByLabel(/^Nomor WhatsApp/);
    const original = await whatsapp.inputValue();
    await whatsapp.fill("021-555");
    await contact.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(contact.getByText("Masukkan nomor HP Indonesia")).toBeVisible();
    await expect(whatsapp).toBeFocused();
    await whatsapp.fill(original);

    const address = contact.getByLabel(/^Alamat/);
    const previous = await address.inputValue();
    const e2eAddress = `Jl. Uji E2E No. ${Date.now() % 1000}, Kab. Bogor`;
    await address.fill(e2eAddress);
    await save(page, contact);
    await expect(page.getByText(/Terakhir diubah .* oleh E2E Admin/).first()).toBeVisible();

    try {
      await page.goto("/kontak");
      await expect(page.getByRole("contentinfo")).toContainText(e2eAddress);
    } finally {
      await page.goto("/admin/pengaturan");
      await page
        .locator("form")
        .first()
        .getByLabel(/^Alamat/)
        .fill(previous);
      await save(page, page.locator("form").first());
    }
  });

  test("overrides a page title and falls back when cleared", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "saves shared data: desktop only");
    await signInTo(page, "/admin/seo", e2eUsers(testInfo.project.name).admin.email);

    const edit = async () => {
      await page.getByRole("button", { name: "Ubah SEO halaman Daftar Unit" }).click();
      return page.getByRole("dialog", { name: "SEO · Daftar Unit" });
    };

    let sheet = await edit();
    const title = sheet.getByRole("group", { name: "Bahasa Indonesia" }).getByLabel("Judul");
    await title.fill("Direktori Unit Uji E2E");
    await expect(sheet.getByText("Direktori Unit Uji E2E · BEC")).toBeVisible();
    await save(page, sheet);
    await expect(sheet).toBeHidden();

    try {
      await page.goto("/unit");
      await expect(page).toHaveTitle("Direktori Unit Uji E2E · BEC");
      await page.goto("/en/units");
      // Overrides are per locale: the English page keeps its own title.
      await expect(page).toHaveTitle("BEC Units by Area · BEC");
    } finally {
      await page.goto("/admin/seo");
      sheet = await edit();
      await sheet.getByRole("group", { name: "Bahasa Indonesia" }).getByLabel("Judul").fill("");
      await save(page, sheet);
    }
    await page.goto("/unit");
    await expect(page).toHaveTitle(/Daftar Unit BEC per Wilayah/);
  });

  test("lets an editor manage SEO texts but not indexing or settings", async ({
    page,
  }, testInfo) => {
    await signInTo(page, "/admin/seo", e2eUsers(testInfo.project.name).editor.email);
    await page.getByRole("button", { name: "Ubah SEO halaman Beranda" }).click();
    const sheet = page.getByRole("dialog", { name: "SEO · Beranda" });
    await expect(sheet.getByRole("checkbox", { name: /noindex/ })).toBeDisabled();
    await expect(sheet.getByText("Hanya super admin yang bisa mengubah")).toBeVisible();
    await page.keyboard.press("Escape");

    await page.goto("/admin/pengaturan");
    await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
  });
});
