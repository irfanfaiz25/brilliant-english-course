import type { Page } from "@playwright/test";

/** Accounts the auth E2E specs sign in with; one set per Playwright project so runs don't collide. */
export const E2E_PASSWORD = "e2e-password-123";

export const e2eUsers = (project: string) => ({
  admin: { email: `e2e-admin-${project}@bec.test`, name: "E2E Admin", role: "super_admin" },
  editor: { email: `e2e-editor-${project}@bec.test`, name: "E2E Editor", role: "editor" },
  disabled: { email: `e2e-disabled-${project}@bec.test`, name: "E2E Disabled", role: "editor" },
});

export const e2eProjects = ["desktop", "mobile"] as const;

/** Fills and submits the admin sign-in form on the current page. */
export async function signIn(page: Page, email: string, password = E2E_PASSWORD) {
  const main = page.getByRole("main");
  await main.getByLabel(/^Email/).fill(email);
  await main.getByLabel(/^Kata sandi/).fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
}

/** Signs out through the account menu in the admin top bar. */
export async function signOut(page: Page) {
  await page.getByRole("button", { name: /Menu akun/ }).click();
  await page.getByRole("button", { name: "Keluar" }).click();
}
