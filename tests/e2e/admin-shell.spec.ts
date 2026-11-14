import { expect, test, type Page } from "@playwright/test";

import { e2eUsers, signIn } from "./auth-users";

/** The sidebar on desktop, the menu sheet on phones. */
async function adminNav(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByRole("button", { name: "Buka menu" }).click();
    return page.getByRole("dialog", { name: "Menu admin" }).getByRole("navigation");
  }
  return page.getByRole("complementary").getByRole("navigation");
}

test.describe("admin shell", () => {
  test("shows a super admin every module and the network numbers", async ({
    page,
    isMobile,
  }, testInfo) => {
    const users = e2eUsers(testInfo.project.name);
    await page.goto("/admin/masuk");
    await signIn(page, users.admin.email);
    await expect(page.getByRole("heading", { level: 1, name: "Ringkasan" })).toBeVisible();

    // Computed from the dev seed (8 active units in 4 regencies).
    const kpis = page.getByRole("main").getByRole("definition");
    await expect(kpis.filter({ hasText: "di 4 kab/kota" })).toContainText("8");
    await expect(page.getByRole("heading", { name: "Calon mitra terbaru" })).toBeVisible();

    const nav = await adminNav(page, isMobile);
    await expect(nav.getByRole("link", { name: "Ringkasan" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    for (const name of ["Calon Mitra", "Artikel Blog", "Testimoni", "SEO"]) {
      await expect(nav.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
    }

    await nav.getByRole("link", { name: /^Pengguna/ }).click();
    await expect(page).toHaveURL(/\/admin\/pengguna$/);
    await expect(page.getByRole("heading", { level: 1, name: "Pengguna" })).toBeVisible();
    await expect(page.getByText("Segera hadir di tahap 4g")).toBeVisible();
  });

  test("shows an editor only content modules and hides partner data", async ({
    page,
    isMobile,
  }, testInfo) => {
    const users = e2eUsers(testInfo.project.name);
    await page.goto("/admin/masuk");
    await signIn(page, users.editor.email);
    await expect(page.getByText("Halo, E2E Editor")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Calon mitra terbaru" })).toHaveCount(0);

    const nav = await adminNav(page, isMobile);
    await expect(nav.getByRole("link", { name: /^Artikel Blog/ })).toBeVisible();
    for (const name of ["Calon Mitra", "Unit Mitra", "Pengguna", "Pengaturan"]) {
      await expect(nav.getByRole("link", { name: new RegExp(`^${name}`) })).toHaveCount(0);
    }

    // Typing the URL is not a way around the menu: same not-found page as an unknown URL.
    await page.goto("/admin/calon-mitra");
    await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
    await expect(page.getByText("Segera hadir")).toHaveCount(0);
  });

  test("starts keyboard navigation with a skip link to the content", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "keyboard check on desktop");
    const users = e2eUsers(testInfo.project.name);
    await page.goto("/admin/masuk");
    await signIn(page, users.admin.email);
    await expect(page.getByRole("heading", { level: 1, name: "Ringkasan" })).toBeVisible();
    await page.goto("/admin");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Langsung ke konten" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
  });

  test("shows where a page sits with a breadcrumb trail", async ({ page, isMobile }, testInfo) => {
    const users = e2eUsers(testInfo.project.name);
    await page.goto("/admin/masuk?next=%2Fadmin%2Fprogram%2Fintro");
    await signIn(page, users.admin.email);
    await expect(page).toHaveURL(/\/admin\/program\/intro$/);

    const trail = page.getByRole("navigation", { name: "Jejak navigasi" });
    const level = await page.getByRole("heading", { level: 1 }).textContent();
    if (isMobile) {
      // Phones show only the way up.
      await expect(trail.getByRole("link")).toHaveText(["Program"]);
      await expect(trail.getByRole("link", { name: "Ringkasan" })).toBeHidden();
    } else {
      await expect(trail.getByRole("listitem")).toHaveText([
        "Ringkasan",
        "Program",
        (level ?? "").replace(/^Level /, ""),
      ]);
      await expect(trail.locator("[aria-current=page]")).toBeVisible();
    }
    await trail.getByRole("link", { name: "Program" }).click();
    await expect(page).toHaveURL(/\/admin\/program$/);
    await expect(page.getByRole("heading", { level: 1, name: "Program" })).toBeVisible();
  });

  test("keeps signed-out visitors out of module pages", async ({ page }) => {
    await page.goto("/admin/kuota");
    await expect(page).toHaveURL(/\/admin\/masuk\?next=%2Fadmin%2Fkuota$/);
  });

  test("answers unknown admin pages with not found", async ({ page }, testInfo) => {
    const users = e2eUsers(testInfo.project.name);
    await page.goto("/admin/masuk");
    await signIn(page, users.admin.email);
    await expect(page.getByRole("heading", { level: 1, name: "Ringkasan" })).toBeVisible();
    await page.goto("/admin/tidak-ada");
    await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
  });
});
