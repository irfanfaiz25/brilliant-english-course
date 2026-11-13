import { expect, test, type Page } from "@playwright/test";

/** Visible matches only: streamed Suspense content can briefly exist twice (see finder.spec). */
const visibleText = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true });

/**
 * Note: the Server Action rate-limits submissions per IP (`limits.partnerApplication`). Each run
 * submits twice (desktop + mobile); restart a reused local server when re-running this spec often.
 */
const partnerForm = (page: Page) => page.getByRole("form", { name: "Formulir pendaftaran mitra" });

async function fillContactStep(page: Page) {
  const form = partnerForm(page);
  await form.getByLabel("Nama lengkap").fill("Rina Lestari");
  await form.getByLabel("Nomor WhatsApp").fill("0812 3456 7890");
  await form.getByRole("button", { name: "Lanjut" }).click();
  await expect(form.getByRole("button", { name: "Kirim pendaftaran" })).toBeVisible();
}

test.describe("partnership page", () => {
  test("presents the partner journey with section tabs", async ({ page }) => {
    await page.goto("/kemitraan");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Buka Unit Kursus Bahasa Inggris Anak di Rumahmu",
      }),
    ).toBeVisible();
    const tabs = page.getByRole("navigation", { name: "Bagian halaman kemitraan" });
    await expect(tabs.getByRole("link")).toHaveCount(6);
    await expect(
      page.getByRole("heading", { name: "Semua yang Kamu Butuhkan Sudah Disiapkan" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "5 Langkah Sampai Unitmu Aktif" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pertanyaan Calon Mitra" })).toBeVisible();
    await expect(visibleText(page, "Pilih desa untuk melihat kuota")).toBeVisible();
  });

  test("arrives from Cek Unit with the village pre-selected", async ({ page }) => {
    await page.goto("/kemitraan?wilayah=36.03.18.2009#daftar");

    const quota = page.getByRole("article", { name: "Bitung Jaya" });
    await expect(quota).toBeVisible();
    await expect(quota.getByText("Tersedia", { exact: true })).toBeVisible();
    await expect(quota.getByText("2 dari 2 slot masih tersedia")).toBeVisible();
    await expect(
      partnerForm(page).getByText(/^Bitung Jaya · Cikupa, Kab\. Tangerang$/),
    ).toBeVisible();
  });

  test("blocks a full village and points to its units", async ({ page }) => {
    await page.goto("/kemitraan?wilayah=32.01.01.1006");

    const quota = page.getByRole("article", { name: "Cibinong" });
    await expect(quota.getByText("Penuh", { exact: true })).toBeVisible();
    await expect(quota.getByRole("link", { name: "Lihat unit di Cibinong" })).toHaveAttribute(
      "href",
      "/cek-unit?wilayah=32.01.01.1006",
    );

    await expect(partnerForm(page).getByText(/^Kuota desa ini sudah penuh/)).toBeVisible();
    await fillContactStep(page);
    await expect(
      partnerForm(page).getByRole("button", { name: "Kirim pendaftaran" }),
    ).toBeDisabled();
  });

  test("validates each step and submits the application", async ({ page }) => {
    await page.goto("/kemitraan?wilayah=32.01.01.1008#daftar");
    const form = partnerForm(page);

    await form.getByRole("button", { name: "Lanjut" }).click();
    await expect(form.getByText("Isi nama lengkapmu.")).toBeVisible();
    await expect(form.getByLabel("Nama lengkap")).toBeFocused();

    await form.getByLabel("Nomor WhatsApp").fill("0211234567");
    await form.getByRole("button", { name: "Lanjut" }).click();
    await expect(form.getByText(/Gunakan nomor HP Indonesia/)).toBeVisible();

    await fillContactStep(page);
    await form.getByRole("button", { name: "Kirim pendaftaran" }).click();
    await expect(form.getByText("Centang persetujuan untuk melanjutkan.")).toBeVisible();

    await form.getByText("Ibu / bapak rumah tangga").click();
    await form.getByText("Sudah ada").click();
    await form.getByLabel(/Saya setuju dihubungi/).check();
    await form.getByRole("button", { name: "Kirim pendaftaran" }).click();

    await expect(page.getByRole("heading", { name: "Pendaftaran terkirim!" })).toBeFocused();
    const reference = page.getByText(/^MTR-\d{6}-[A-Z0-9]{4}$/);
    await expect(reference).toBeVisible();
    await expect(page.getByRole("link", { name: "Lanjut chat di WhatsApp" })).toHaveAttribute(
      "href",
      new RegExp(`^https://wa\\.me/\\d+\\?text=.*${await reference.textContent()}`),
    );
  });

  test("asks for a village before submitting", async ({ page }) => {
    await page.goto("/kemitraan#daftar");
    const form = partnerForm(page);

    await fillContactStep(page);
    await form.getByText("Guru / pendidik").click();
    await form.getByText("Belum ada").click();
    await form.getByLabel(/Saya setuju dihubungi/).check();
    await form.getByRole("button", { name: "Kirim pendaftaran" }).click();

    await expect(form.getByRole("alert")).toContainText("Pilih desa di cek kuota terlebih dahulu.");
    await expect(form.getByRole("link", { name: "Pilih desa" })).toHaveAttribute("href", "#kuota");
  });

  test("English page uses its localized URL", async ({ page }) => {
    await page.goto("/en/partnership?wilayah=32.01.06.2001");

    await expect(page).toHaveTitle(/Partnership/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Open a Kids' English Course Unit at Home" }),
    ).toBeVisible();
    await expect(
      page.getByRole("article", { name: "Sukamaju" }).getByText("1 slot left", { exact: true }),
    ).toBeVisible();
  });
});
