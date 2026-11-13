import { expect, test } from "@playwright/test";

// Motion primitives on the internal preview (requires ENABLE_DESIGN_PREVIEW).
const revealText = "Fades up 24 px once, when 20% is visible.";

test.describe("motion", () => {
  test("count-up reaches the final value and exposes it to assistive tech", async ({ page }) => {
    await page.goto("/design-system");
    const stats = page.getByTestId("count-up-demo");
    await stats.scrollIntoViewIfNeeded();

    // The animated digits are aria-hidden; assistive tech reads the final value once.
    await expect(stats.locator(".tabular-nums").filter({ hasText: "5.400" })).toBeVisible({
      timeout: 5000,
    });
    await expect(stats).toMatchAriaSnapshot(`- definition: "5.400+"`);
  });

  test("reveals settle without movement when reduced motion is requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/design-system#motion");
    const reveal = page.getByText(revealText).locator("xpath=..");

    await expect(reveal).toHaveCSS("opacity", "1");
    await expect(reveal).toHaveCSS("transform", "none");
  });
});

test.describe("motion without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("content waiting for a reveal is still visible", async ({ page }) => {
    await page.goto("/design-system#motion");
    const reveal = page.getByText(revealText).locator("xpath=..");

    await expect(reveal).toHaveCSS("opacity", "1");
    await expect(page.getByRole("heading", { name: "Story Telling Day" })).toBeVisible();
  });
});
