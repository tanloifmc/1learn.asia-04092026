import crypto from "node:crypto";
import { readFile } from "node:fs/promises";

export const MOET_MAJOR_CATALOG_SOURCE = {
  name: "Bộ Giáo dục và Đào tạo — Thông tư 09/2022/TT-BGDĐT",
  url: "https://datafiles.chinhphu.vn/cpp/files/vbpq/2022/06/09-bgddt.pdf",
  version: "09/2022/TT-BGDĐT",
};

export const MOET_MAJOR_CATALOG_TRANSCRIPT = {
  name: "Thư Viện Pháp Luật — transcript của Thông tư 09/2022/TT-BGDĐT",
  url: "https://thuvienphapluat.vn/van-ban/Giao-duc/Thong-tu-09-2022-TT-BGDDT-Danh-muc-thong-ke-nganh-dao-tao-giao-duc-dai-hoc-516993.aspx?tab=4",
  cachePath: ".firecrawl/thong-tu-09-2022-transcript.md",
};

export function normalizeCatalogText(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replaceAll("đ", "d")
    .replaceAll("Đ", "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchMoetMajorCatalog() {
  const response = await fetch(MOET_MAJOR_CATALOG_SOURCE.url, {
    headers: {
      "user-agent": "1learn-master-data-verifier/1.0 (+https://1learn.asia)",
      accept: "application/pdf",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(`MoET catalog returned HTTP ${response.status}.`);
  }

  const body = Buffer.from(await response.arrayBuffer());
  if (body.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("MoET catalog response is not a PDF.");
  }

  return {
    sourceSha256: crypto.createHash("sha256").update(body).digest("hex"),
    bytes: body.length,
  };
}

export async function loadMoetMajorCatalogTranscript() {
  const markdown = await readFile(MOET_MAJOR_CATALOG_TRANSCRIPT.cachePath, "utf8");
  const normalizedText = normalizeCatalogText(markdown);
  if (!/thong tu 09\/2022\/tt-bgddt/.test(normalizedText) || !/danh muc thong ke nganh dao tao/.test(normalizedText)) {
    throw new Error("Cached transcript is not the expected Thông tư 09/2022 document.");
  }

  const entries = new Map();
  for (const row of markdown.matchAll(/^\|\s*(\d{7})\s*\|\s*(.*?)\s*\|/gm)) {
    const [, code, rawName] = row;
    const name = rawName
      .replaceAll("<br>", " ")
      .replaceAll("<br/>", " ")
      .replaceAll("**", "")
      .replace(/\\-/g, "-")
      .replace(/\s+/g, " ")
      .trim();
    if (name) entries.set(code, name);
  }
  if (entries.size < 200) {
    throw new Error(`Transcript parsing yielded only ${entries.size} seven-digit majors; refusing to use it.`);
  }

  return {
    entries,
    sourceSha256: crypto.createHash("sha256").update(markdown).digest("hex"),
    bytes: Buffer.byteLength(markdown),
  };
}

export function assessMajorsAgainstMoetCatalog(majors, transcriptEntries) {
  return majors.map((major) => {
    const normalizedName = normalizeCatalogText(major.name);
    const sourceName = transcriptEntries.get(major.code);
    const codeFound = Boolean(sourceName);
    const exactNameFound = sourceName
      ? normalizeCatalogText(sourceName) === normalizedName
      : false;
    return {
      ...major,
      sourceName: sourceName ?? null,
      codeFound,
      exactNameFound,
      isVerifiedMatch: codeFound && exactNameFound,
    };
  });
}
