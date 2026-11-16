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
    await expect(tabs.getByRole("link")).toHaveCount(8);
    await expect(
      page.getByRole("list", { name: "Keunggulan kemitraan" }).getByText("Tanpa bagi hasil"),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Kenapa Bergabung dengan BEC?" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "5 Langkah Jadi Mitra BEC" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pertanyaan Calon Mitra" })).toBeVisible();
    await expect(visibleText(page, "Pilih desa untuk melihat kuota")).toBeVisible();
  });

  test("filters the starter kit and walks through a lesson", async ({ page }) => {
    await page.goto("/kemitraan#starter-kit");

    const kit = page.locator("#starter-kit");
    const filters = kit.getByRole("group", { name: "Saring isi starter kit" });
    await filters.getByRole("button", { name: /^Perlengkapan kelas/ }).click();
    await expect(filters.getByRole("button", { name: /^Perlengkapan kelas/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(kit.getByRole("heading", { name: "Boardgames" })).toBeVisible();
    await expect(kit.getByRole("heading", { name: "Silabus" })).toHaveCount(0);
    await filters.getByRole("button", { name: /^Semua/ }).click();
    await expect(kit.getByRole("heading", { name: "Silabus" })).toBeVisible();

    const stages = page.getByRole("tablist", { name: "Alur satu sesi kelas BEC" });
    await stages.getByRole("tab", { name: /Pembukaan/ }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(stages.getByRole("tab", { name: /Apersepsi/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("tabpanel")).toContainText("Tahap 2 dari 6");
    await page.getByRole("button", { name: "Berikutnya" }).click();
    await expect(page.getByRole("tabpanel")).toContainText("Tahap 3 dari 6");

    // The training gallery opens a viewer that moves with the arrow keys (the dev seed has photos).
    await page.getByRole("button", { name: "Buka foto 1" }).filter({ visible: true }).click();
    const viewer = page.getByRole("dialog");
    await expect(viewer).toContainText(/Foto 1 dari \d+/);
    await page.keyboard.press("ArrowRight");
    await expect(viewer).toContainText(/Foto 2 dari \d+/);
    await page.keyboard.press("Escape");
    await expect(viewer).toHaveCount(0);
  });

  test("finds a village by name, even misspelled, and checks its quota (ADR-047)", async ({
    page,
  }) => {
    await page.goto("/kemitraan#kuota");
    const search = page.getByRole("combobox", { name: "Cari desa/kelurahan" });
    // The step-by-step cascade is folded away until a village is chosen.
    await expect(page.getByRole("combobox", { name: "Provinsi" })).toBeHidden();

    // "Singorejo" is how people spell Singorojo (Jepara); close spellings are found too.
    await search.fill("singorejo");
    await expect(
      page.getByRole("option", { name: /Singorojo.*Mayong, Kab\. Jepara/ }),
    ).toBeVisible();

    await search.fill("tanah baru");
    const option = page.getByRole("option", { name: /Tanah Baru.*Beji, Kota Depok/ });
    await expect(option.getByText("Tersedia")).toBeVisible();
    await option.click();

    await expect(page).toHaveURL(/\?wilayah=32\.76\.06\.1003/);
    await expect(page.getByRole("article", { name: "Tanah Baru" })).toBeVisible();
    // The cascade opens on the chosen path.
    await expect(page.getByRole("combobox", { name: "Kecamatan" })).toHaveValue("32.76.06");
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
