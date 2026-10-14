import { chromium } from "playwright";

export const moetUniversityDirectoryUrl = "https://moet.gov.vn/co-so-giao-duc/danh-sach-cac-co-so-giao-duc";
export const moetUniversityDirectorySourceName = "Bộ Giáo dục và Đào tạo — Danh sách các cơ sở giáo dục";

export const normalizeMoetUniversityName = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/Đ/g, "D")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .replace(/\s+/g, " ");

export async function readMoetUniversityDirectory() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(moetUniversityDirectoryUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.locator("#module18 table tbody tr").first().waitFor({ state: "visible", timeout: 60_000 });
    const records = [];

    for (const pageNumber of [1, 2, 3, 4]) {
      if (pageNumber > 1) {
        await page.locator("#pagination18").getByRole("link", { name: String(pageNumber), exact: true }).click();
        await page.waitForFunction(
          (firstOrdinal) => Number(document.querySelector("#module18 table tbody tr td")?.textContent?.trim()) === firstOrdinal,
          (pageNumber - 1) * 100 + 1,
          { timeout: 30_000 },
        );
      }

      records.push(...await page.locator("#module18 table tbody tr").evaluateAll((rows) => rows.map((row) => {
        const cells = Array.from(row.querySelectorAll("td"));
        const link = row.querySelector("a");
        return {
          ordinal: Number(cells[0]?.textContent?.trim()),
          name: link?.textContent?.trim(),
          code: cells[2]?.textContent?.trim(),
          detailUrl: new URL(link?.getAttribute("href") ?? "", location.origin).href,
        };
      }).filter((row) => Number.isInteger(row.ordinal) && row.ordinal > 0 && row.name && row.code && row.detailUrl)));
    }

    const invalidRows = records
      .filter((row, index) => row.ordinal !== index + 1 || !row.name || !row.code || !row.detailUrl)
      .map((row) => ({ ordinal: row.ordinal, name: row.name, code: row.code, detailUrl: row.detailUrl }));
    if (records.length !== 327 || new Set(records.map((row) => row.code)).size !== 327 || invalidRows.length > 0) {
      throw new Error(`Official MoET directory integrity check failed: ${JSON.stringify({ records: records.length, uniqueCodes: new Set(records.map((row) => row.code)).size, invalidRows })}`);
    }

    return records;
  } finally {
    await browser.close();
  }
}
