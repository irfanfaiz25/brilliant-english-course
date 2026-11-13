import { expect, test } from "@playwright/test";

test.describe("contact page", () => {
  test("routes visitors to the right channel", async ({ page }) => {
    await page.goto("/kontak");

    await expect(page.getByRole("heading", { level: 1, name: "Kami Siap Membantu" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Cek Unit Terdekat" }).first()).toHaveAttribute(
      "href",
      "/cek-unit",
    );
    await expect(page.getByRole("link", { name: "Lihat Kemitraan" })).toHaveAttribute(
      "href",
      "/kemitraan",
    );
    await expect(page.getByRole("link", { name: "Kirim email" })).toHaveAttribute(
      "href",
      /^mailto:/,
    );
    await expect(page.getByRole("link", { name: "Petunjuk arah" })).toHaveAttribute(
      "href",
      /google\.com\/maps/,
    );
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.some((data) => data.includes('"@type":"EducationalOrganization"'))).toBe(true);
  });

  test("composes a WhatsApp message after validation", async ({ page, context }) => {
    await page.goto("/kontak#pesan");
    const form = page.getByRole("form", { name: "Formulir pesan WhatsApp" });

    await form.getByRole("button", { name: "Lanjut ke WhatsApp" }).click();
    await expect(form.getByText("Pilih salah satu.")).toBeVisible();
    await expect(form.getByText("Isi namamu.")).toBeVisible();

    await form.getByText("Orang tua", { exact: true }).click();
    await form.getByLabel("Nama").fill("Rina");
    await form.getByLabel("Pesan").fill("Apakah ada kelas Kindy hari Sabtu?");

    const popup = context.waitForEvent("page");
    await form.getByRole("button", { name: "Lanjut ke WhatsApp" }).click();
    const whatsapp = await popup;
    const url = new URL(whatsapp.url());
    expect(url.hostname).toMatch(/wa\.me|whatsapp\.com/);
    await whatsapp.close();

    const again = form.getByRole("link", { name: /Buka WhatsApp/ });
    await expect(again).toBeVisible();
    const text = new URL((await again.getAttribute("href")) ?? "").searchParams.get("text");
    expect(text).toBe("Halo BEC, saya Rina (Orang tua).\n\nApakah ada kelas Kindy hari Sabtu?");
  });

  test("English page uses its localized URL", async ({ page }) => {
    await page.goto("/en/contact");
    await expect(page).toHaveTitle(/Contact/);
    await expect(page.getByRole("heading", { level: 1, name: "We're Here to Help" })).toBeVisible();
  });
});
