import { expect, test, type Page } from "@playwright/test";

import { E2E_PASSWORD, e2eUsers } from "./auth-users";

async function signIn(page: Page, email: string, password = E2E_PASSWORD) {
  await page
    .getByRole("main")
    .getByLabel(/^Email/)
    .fill(email);
  await page
    .getByRole("main")
    .getByLabel(/^Kata sandi/)
    .fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
}

test.describe("admin authentication", () => {
  test("sends signed-out visitors to sign in and back where they were going", async ({
    page,
  }, testInfo) => {
    const users = e2eUsers(testInfo.project.name);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/masuk\?next=%2Fadmin$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Masuk ke dashboard");

    await signIn(page, users.admin.email);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Halo, E2E Admin");
    await expect(page.getByText("Super admin")).toBeVisible();

    await page.getByRole("button", { name: "Keluar" }).click();
    await expect(page).toHaveURL(/\/admin\/masuk$/);
    // The session is gone on the server, not only hidden.
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/masuk/);
  });

  test("rejects a wrong password without saying which part was wrong", async ({
    page,
  }, testInfo) => {
    const users = e2eUsers(testInfo.project.name);
    await page.goto("/admin/masuk");
    await signIn(page, users.editor.email, "wrong-password-1");
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "Email atau kata sandi salah.",
    );
    await expect(page.getByRole("main").getByLabel(/^Kata sandi/)).toHaveValue("");
    await expect(page).toHaveURL(/\/admin\/masuk$/);
  });

  test("validates the form before calling the server", async ({ page }) => {
    await page.goto("/admin/masuk");
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page.getByText("Isi email.")).toBeVisible();
    await expect(page.getByText("Isi kata sandi.")).toBeVisible();
  });

  test("keeps deactivated accounts out", async ({ page }, testInfo) => {
    const users = e2eUsers(testInfo.project.name);
    await page.goto("/admin/masuk");
    await signIn(page, users.disabled.email);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "Akun ini dinonaktifkan. Hubungi super admin.",
    );
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/masuk/);
  });

  test("ignores a redirect target outside the admin area", async ({ page }, testInfo) => {
    const users = e2eUsers(testInfo.project.name);
    await page.goto("/admin/masuk?next=https%3A%2F%2Fevil.example%2Fadmin");
    await signIn(page, users.editor.email);
    await expect(page).toHaveURL(/localhost:\d+\/admin$/);
    await expect(page.getByText("Editor", { exact: true })).toBeVisible();
  });
});

test.describe("password reset", () => {
  test("confirms the request the same way for unknown emails", async ({ page }) => {
    await page.goto("/admin/masuk");
    await page.getByRole("link", { name: "Lupa kata sandi?" }).click();
    await expect(page).toHaveURL(/\/admin\/lupa-password$/);
    await page
      .getByRole("main")
      .getByLabel(/^Email/)
      .fill("nobody@bec.test");
    await page.getByRole("button", { name: "Kirim tautan" }).click();
    const status = page.getByRole("main").getByRole("status");
    await expect(status).toContainText("Cek email kamu");
    await expect(status).toBeFocused();
  });

  test("rejects an invalid or missing token", async ({ page }) => {
    await page.goto("/admin/reset-password");
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Tautan tidak lengkap");

    await page.goto("/admin/reset-password?token=not-a-real-token");
    const password = page.getByRole("main").getByLabel(/^Kata sandi baru/);
    await password.fill("new-password-123");
    await page
      .getByRole("main")
      .getByLabel(/^Ulangi kata sandi baru/)
      .fill("new-password-123");
    await page.getByRole("button", { name: "Simpan kata sandi" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "Tautan sudah tidak berlaku. Minta tautan baru.",
    );
    await expect(page.getByRole("link", { name: "Minta tautan baru" })).toBeVisible();
  });

  test("checks password rules in the browser", async ({ page }) => {
    await page.goto("/admin/reset-password?token=anything");
    await page
      .getByRole("main")
      .getByLabel(/^Kata sandi baru/)
      .fill("short");
    await page
      .getByRole("main")
      .getByLabel(/^Ulangi kata sandi baru/)
      .fill("different");
    await page.getByRole("button", { name: "Simpan kata sandi" }).click();
    await expect(page.getByText("Kata sandi minimal 10 karakter.")).toBeVisible();
    await expect(page.getByText("Kata sandi tidak sama.")).toBeVisible();
  });
});

test("the admin area is never indexed", async ({ page }) => {
  await page.goto("/admin/masuk");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});
