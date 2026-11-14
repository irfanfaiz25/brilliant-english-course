import { expect, test, type Page } from "@playwright/test";

import { e2eUsers, signIn } from "../auth-users";

/*
 * ADR-036: a super admin ticks what a role may do and it applies at once. Role permissions are
 * global, so this runs in the "publishing" project after the specs that check the editor's menu,
 * and puts the defaults back (global setup also clears them before every run).
 */

test.slow();

async function signInTo(page: Page, path: string, email: string) {
  await page.goto(`/admin/masuk?next=${encodeURIComponent(path)}`);
  await signIn(page, email);
  await page.waitForURL((url) => url.pathname === path);
  await page.waitForLoadState("networkidle");
}

const editorPanel = (page: Page) => page.locator('[role="tabpanel"][data-state="active"]');

test.describe("role permissions", () => {
  test("lets a super admin open a module to editors and take it back", async ({
    page,
    browser,
  }) => {
    const users = e2eUsers("desktop");
    await signInTo(page, "/admin/pengguna/hak-akses", users.admin.email);
    await expect(page.getByText(/Super admin selalu punya akses penuh/)).toBeVisible();

    await page.getByRole("tab", { name: /^Editor/ }).click();
    const leadsRead = editorPanel(page).getByRole("checkbox", {
      name: "Lihat Calon Mitra untuk Editor",
    });
    await expect(leadsRead).not.toBeChecked();
    // Ticking "edit" brings "view" along.
    await editorPanel(page)
      .getByRole("checkbox", { name: "Ubah Calon Mitra untuk Editor" })
      .check();
    await expect(leadsRead).toBeChecked();
    // Users can only be given "view".
    await expect(
      editorPanel(page).getByRole("checkbox", { name: "Ubah Pengguna untuk Editor" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page.getByText("Hak akses tersimpan dan langsung berlaku.")).toBeVisible();

    const other = await browser.newContext();
    const editor = await other.newPage();
    try {
      await signInTo(editor, "/admin/calon-mitra", users.editor.email);
      await expect(editor.getByRole("heading", { level: 1, name: "Calon Mitra" })).toBeVisible();
    } finally {
      // Back to the defaults, then the editor loses the module again.
      await page.reload();
      await page.waitForLoadState("networkidle");
      await page.getByRole("tab", { name: /^Editor/ }).click();
      await page.getByRole("button", { name: "Kembalikan ke bawaan" }).click();
      await page.getByRole("button", { name: "Simpan perubahan" }).click();
      await expect(page.getByText("Hak akses tersimpan dan langsung berlaku.")).toBeVisible();
    }
    try {
      await editor.goto("/admin/calon-mitra");
      await expect(editor.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
    } finally {
      await other.close();
    }
  });
});
