import { expect, test, type Page } from "@playwright/test";

import { e2eUsers, signIn } from "./auth-users";

/*
 * Phase 4g: accounts. A super admin adds an editor, who activates the account from the link and
 * signs in; switching the account off ends that session. Accounts are never deleted (ADR-035),
 * so each run leaves one disabled account with a unique address. Desktop only: it changes shared
 * data and needs two browser contexts.
 */

test.skip(({ isMobile }) => isMobile, "creates accounts: desktop only");
test.slow();

async function signInTo(page: Page, path: string, email: string, password?: string) {
  await page.goto(`/admin/masuk?next=${encodeURIComponent(path)}`);
  await signIn(page, email, password);
  await page.waitForURL((url) => url.pathname === path);
  // Forms must be hydrated before typing, or React Hook Form misses the change.
  await page.waitForLoadState("networkidle");
}

test.describe("admin users", () => {
  test("invites an editor who activates, signs in and is switched off", async ({
    page,
    browser,
  }) => {
    const admin = e2eUsers("desktop").admin;
    const stamp = Date.now() % 100000;
    const name = `Editor Uji ${stamp}`;
    const email = `e2e-invite-${stamp}@bec.test`;
    const password = "kata-sandi-uji-123";
    const newPassword = "kata-sandi-baru-456";

    await signInTo(page, "/admin/pengguna", admin.email);
    await page.getByRole("link", { name: "Tambah pengguna" }).click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("textbox", { name: "Nama" }).fill(name);

    // An address already in use is refused on its field (any letter case).
    await page.getByRole("textbox", { name: "Email" }).fill(admin.email.toUpperCase());
    await page.getByRole("button", { name: "Tambah pengguna" }).click();
    await expect(page.getByText("Email ini sudah dipakai akun lain.")).toBeVisible();

    // A partner needs a unit; staff roles show no unit field.
    await page.getByRole("radio", { name: /^Mitra/ }).check();
    await expect(page.getByRole("combobox", { name: "Unit" })).toBeVisible();
    await page.getByRole("radio", { name: /^Editor/ }).check();
    await expect(page.getByRole("combobox", { name: "Unit" })).toHaveCount(0);

    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByRole("button", { name: "Tambah pengguna" }).click();
    const dialog = page.getByRole("dialog", { name: `Tautan aktivasi untuk ${name}` });
    await expect(dialog).toBeVisible();
    const link = await dialog.getByRole("textbox", { name: "Tautan" }).inputValue();
    expect(link).toContain("/admin/aktivasi?token=");
    await dialog.getByRole("button", { name: "Selesai" }).click();
    await expect(page).toHaveURL(/\/admin\/pengguna\/[0-9a-f-]{36}$/);
    const accountPage = page.url();
    await expect(page.getByText("Menunggu aktivasi")).toBeVisible();

    // The invited person, in their own browser.
    const invitee = await browser.newContext();
    const other = await invitee.newPage();
    try {
      await other.goto(new URL(link).pathname + new URL(link).search);
      await expect(other.getByRole("heading", { name: "Aktifkan akunmu" })).toBeVisible();
      await other.waitForLoadState("networkidle");
      await other.getByLabel(/^Kata sandi baru/).fill(password);
      await other.getByLabel(/^Ulangi kata sandi baru/).fill(password);
      await other.getByRole("button", { name: "Aktifkan akun" }).click();
      await expect(other.getByText("Akunmu sudah aktif")).toBeVisible();

      // The link worked once.
      await other.goto(new URL(link).pathname + new URL(link).search);
      await other.waitForLoadState("networkidle");
      await other.getByLabel(/^Kata sandi baru/).fill(password);
      await other.getByLabel(/^Ulangi kata sandi baru/).fill(password);
      await other.getByRole("button", { name: "Aktifkan akun" }).click();
      await expect(other.getByText("Tautan sudah tidak berlaku. Minta tautan baru.")).toBeVisible();

      // An editor signs in and does not see the Users module.
      await signInTo(other, "/admin/akun", email, password);
      await expect(other.getByRole("heading", { level: 1, name: "Akun saya" })).toBeVisible();
      await expect(other.getByRole("link", { name: /^Pengguna/ })).toHaveCount(0);

      // Changing the own password needs the current one.
      await other.getByLabel(/^Kata sandi saat ini/).fill("salah-sekali-123");
      await other.getByLabel(/^Kata sandi baru/).fill(newPassword);
      await other.getByLabel(/^Ulangi kata sandi baru/).fill(newPassword);
      await other.getByRole("button", { name: "Ganti kata sandi" }).click();
      await expect(other.getByText("Kata sandi saat ini salah.")).toBeVisible();
      await other.getByLabel(/^Kata sandi saat ini/).fill(password);
      await other.getByRole("button", { name: "Ganti kata sandi" }).click();
      await expect(
        other.getByText("Kata sandi diganti. Perangkat lain sudah dikeluarkan."),
      ).toBeVisible();

      // Back to the super admin: the account is active and signed in once.
      await page.goto(accountPage);
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("Aktif", { exact: true })).toBeVisible();
      await expect(page.getByText("Masuk di 1 perangkat")).toBeVisible();

      // Switching it off signs the editor out at once.
      await page.getByRole("button", { name: "Nonaktifkan akun" }).click();
      await page
        .getByRole("alertdialog", { name: `Nonaktifkan ${name}?` })
        .getByRole("button", { name: "Nonaktifkan" })
        .click();
      await expect(page.getByText("Akun dinonaktifkan.")).toBeVisible();
      await expect(page.getByText("Nonaktif", { exact: true })).toBeVisible();
      await other.goto("/admin/akun");
      await expect(other).toHaveURL(/\/admin\/masuk/);
    } finally {
      await invitee.close();
    }
  });

  test("keeps a super admin's own role and status out of reach", async ({ page }) => {
    const admin = e2eUsers("desktop").admin;
    await signInTo(page, "/admin/pengguna", admin.email);
    await page.getByRole("searchbox", { name: "Cari pengguna" }).fill(admin.email);
    await expect(page).toHaveURL(/[?&]q=/);
    await page
      .getByRole("link", { name: `Kelola ${admin.name}` })
      .first()
      .click();
    await expect(page.getByText(/Ini akun Anda/)).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Nonaktifkan akun" })).toHaveCount(0);

    // The matrix on the list says what each role may do.
    await page.goto("/admin/pengguna");
    await expect(page.getByRole("table", { name: "Hak akses per peran" })).toBeVisible();
  });
});
