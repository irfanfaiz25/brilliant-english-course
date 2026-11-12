import { expect, test } from "@playwright/test";

// Exercises the UI primitives through the internal preview (requires ENABLE_DESIGN_PREVIEW).
test.describe("UI primitives", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/design-system");
    await expect(page.getByRole("heading", { level: 1, name: "BEC Design System" })).toBeVisible();
  });

  test("combobox filters and selects an option", async ({ page }) => {
    const combobox = page.getByRole("combobox", { name: /Kecamatan/ });
    await combobox.click();
    await page.getByPlaceholder("Cari kecamatan…").fill("cibi");
    await page.getByRole("option", { name: "Cibinong" }).click();

    await expect(combobox).toHaveText(/Cibinong/);
  });

  test("dialog traps focus, closes on Escape and restores focus", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Open dialog" });
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "Lanjut chat admin?" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("toast announces feedback", async ({ page }) => {
    await page.getByRole("button", { name: "Toast success" }).click();
    await expect(page.getByText("Pendaftaran terkirim")).toBeVisible();
  });

  test("accordion answers are in the HTML before opening", async ({ page }) => {
    const answer = page.getByText("Anak bisa mulai dari usia 4 tahun");
    await expect(answer).toBeAttached();
    await expect(answer).toBeHidden();

    await page.getByRole("button", { name: /Mulai usia berapa/ }).click();
    await expect(answer).toBeVisible();
  });
});
