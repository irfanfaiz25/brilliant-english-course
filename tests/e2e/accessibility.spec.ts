import { expect, test, type Page } from "@playwright/test";

// Every public page template (Phase 5 definition of done: keyboard-only and reduced motion).
const pages = [
  "/",
  "/program",
  "/cek-unit",
  "/kemitraan",
  "/blog",
  "/blog/cara-seru-anak-berbicara-bahasa-inggris-di-rumah",
  "/kontak",
  "/unit",
  "/unit/jawa-barat",
  "/unit/jawa-barat/kab-bogor",
  "/unit/jawa-barat/kab-bogor/sukamaju",
  "/en/partnership",
];

const TAB_STOPS = 25;

/** Describes the focused element, or why its focus is not perceivable. */
async function inspectFocus(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { ok: false, reason: "focus lost to <body>" };
    const label = `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 40)}"`;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { ok: false, reason: `${label} has no size` };
    if (el.closest("[aria-hidden='true'], [inert]")) {
      return { ok: false, reason: `${label} is inside hidden content` };
    }
    // Stretched card links draw the ring on their `::after` overlay (the whole card).
    const hasIndicator = [getComputedStyle(el), getComputedStyle(el, "::after")].some(
      (style) =>
        (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) ||
        style.boxShadow !== "none",
    );
    if (!hasIndicator) {
      return { ok: false, reason: `${label} has no visible focus indicator` };
    }
    return { ok: true, reason: label };
  });
}

test.describe("keyboard", () => {
  for (const path of pages) {
    test(`every tab stop is visible and focus-indicated on ${path}`, async ({ page }) => {
      await page.goto(path);
      const seen = new Set<string>();

      for (let stop = 0; stop < TAB_STOPS; stop++) {
        await page.keyboard.press("Tab");
        const focus = await inspectFocus(page);
        expect(focus.ok, focus.reason).toBe(true);
        seen.add(focus.reason);
      }
      // Focus keeps moving through the page instead of getting trapped.
      expect(seen.size).toBeGreaterThan(TAB_STOPS / 2);
    });
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  for (const path of pages) {
    test(`nothing moves and all content shows on ${path}`, async ({ page }) => {
      await page.goto(path);
      // Scroll through so scroll-triggered reveals run.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
          window.scrollTo({ top: y, behavior: "instant" });
          await new Promise((resolve) => setTimeout(resolve, 60));
        }
      });

      const moving = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === "running")
          .filter((animation) => {
            const effect = animation.effect;
            if (!(effect instanceof KeyframeEffect)) return false;
            const duration = Number(effect.getComputedTiming().duration ?? 0);
            const moves = effect
              .getKeyframes()
              .some((frame) =>
                ["transform", "translate", "scale", "rotate"].some((p) => p in frame),
              );
            return moves && duration > 50;
          })
          .map((animation) => (animation.effect as KeyframeEffect).target?.className ?? "?"),
      );
      expect(moving).toEqual([]);

      await expect(async () => {
        const hidden = await page
          .locator("[data-reveal]")
          .evaluateAll((els) => els.filter((el) => getComputedStyle(el).opacity !== "1").length);
        expect(hidden).toBe(0);
      }).toPass({ timeout: 5000 });
    });
  }
});
