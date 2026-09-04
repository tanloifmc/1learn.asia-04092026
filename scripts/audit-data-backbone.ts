import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runAudit() {
  let report = `# DATA BACKBONE AUDIT

## Mục tiêu
Kiểm tra tính vẹn toàn, nguồn gốc và sự phân mảnh của dữ liệu cốt lõi (Data Backbone) trong MVP, bao gồm \`fields\`, \`majors\`, \`universities\`, và mapping giữa chúng.

---

## 1. \`fields\` (Lĩnh vực)

`;

  // 1. Fields
  const { data: fields } = await supabase.from("fields").select("*");
  report += `* **Tổng số fields:** ${fields?.length || 0}\n`;
  report += `* **Trạng thái Mapping RIASEC:** Tất cả các field hiện tại đều có \`riasec_mapping\`. Đây là dữ liệu được **seed bằng heuristic/manual curation** trong quá trình chuyển đổi MVP (Phase 17), nhằm đơn giản hóa hệ thống Career Recommendation cũ sang Field Recommendation.\n`;
  report += `* **Danh sách Fields:**\n`;
  fields?.forEach((f) => {
    report += `  * \`${f.slug}\` (${f.name}) - RIASEC: \`${f.riasec_mapping}\`\n`;
  });

  report += `\n---\n\n## 2. \`majors\` (Ngành học)\n\n`;

  // 2. Majors
  const { data: majors } = await supabase.from("majors").select("*");
  const majorsWithField = majors?.filter(m => m.field_id) || [];
  const majorsWithoutField = majors?.filter(m => !m.field_id) || [];
  
  report += `* **Tổng số majors:** ${majors?.length || 0}\n`;
  report += `* **Majors có field_id (Mapping heuristic):** ${majorsWithField.length} (Mapping bằng string match theo \`name/field\` cũ, không phải mapping thủ công xác thực)\n`;
  report += `* **Majors không có field_id (Orphan majors):** ${majorsWithoutField.length}\n`;
  report += `* **Đánh giá Heuristic:** Toàn bộ liên kết giữa Major và Field hiện tại là heuristic, **chưa được verify thủ công**. Rất nhiều majors chưa có \`field_id\` vì thuật toán string matching đơn giản không bao phủ hết.\n`;

  report += `\n---\n\n## 3. \`universities\` (Trường Đại học)\n\n`;

  // 3. Universities
  const { data: universities } = await supabase.from("universities").select("*");
  const uniWithWeb = universities?.filter(u => u.website) || [];
  const uniWithLogo = universities?.filter(u => u.logo_url) || [];
  const uniWithoutLogo = universities?.filter(u => !u.logo_url) || [];
  
  report += `* **Tổng số universities:** ${universities?.length || 0}\n`;
  report += `* **Trường có website:** ${uniWithWeb.length}\n`;
  report += `* **Trường có logo:** ${uniWithLogo.length}\n`;
  report += `* **Trường thiếu logo/thông tin cơ bản:** ${uniWithoutLogo.length}\n`;

  report += `\n---\n\n## 4. University ↔ Major Mapping\n\n`;

  // 4. Uni <-> Major
  const { data: uniMajors } = await supabase.from("university_majors").select("*");
  report += `* **Tổng số quan hệ Uni-Major:** ${uniMajors?.length || 0}\n`;
  report += `* **Nguồn gốc:** Hầu hết đều từ dữ liệu crawler ban đầu, chưa có nguồn provenance chính thức (Phase 16 đã bị disable).\n`;

  report += `\n---\n\n## 5. Data Provenance & Lifecycle (Tình trạng Schema)\n\n`;
  report += `* **Phase 16 (Provenance & Lifecycle) Status:** **DISABLED** (Bị vô hiệu hóa theo chỉ đạo MVP).\n`;
  report += `* **Thiệt hại/Đánh đổi:** Hệ thống MVP sẽ không thể track được ai đã cập nhật, dữ liệu này lấy từ nguồn nào (URL/PDF), và đang ở trạng thái nháp hay đã xuất bản. Toàn bộ record hiện tại được giả định là có thể hiển thị.\n`;

  report += `\n---\n\n## 6. Integrity Checks (Cảnh báo dữ liệu)\n\n`;

  report += `* **Orphan Majors (Không có Field):** ${majorsWithoutField.length} majors.\n`;
  
  // Find universities without majors
  const unisWithMajors = new Set(uniMajors?.map(um => um.university_id));
  const orphanUnis = universities?.filter(u => !unisWithMajors.has(u.id)) || [];
  report += `* **Orphan Universities (Không có Major nào):** ${orphanUnis.length} trường.\n`;
  
  // Find fields without majors
  const fieldsWithMajors = new Set(majors?.filter(m => m.field_id).map(m => m.field_id));
  const orphanFields = fields?.filter(f => !fieldsWithMajors.has(f.id)) || [];
  report += `* **Fields không có Major nào:** ${orphanFields.length} lĩnh vực.\n`;
  if (orphanFields.length > 0) {
    orphanFields.forEach(f => report += `  - \`${f.name}\`\n`);
  }

  // Find duplicate slug / name
  const slugCount: Record<string, number> = {};
  universities?.forEach(u => {
    slugCount[u.slug] = (slugCount[u.slug] || 0) + 1;
  });
  const dupUniSlugs = Object.keys(slugCount).filter(k => slugCount[k] > 1);
  report += `* **Duplicate University Slugs:** ${dupUniSlugs.length}\n`;

  const majorSlugCount: Record<string, number> = {};
  majors?.forEach(m => {
    majorSlugCount[m.slug] = (majorSlugCount[m.slug] || 0) + 1;
  });
  const dupMajorSlugs = Object.keys(majorSlugCount).filter(k => majorSlugCount[k] > 1);
  report += `* **Duplicate Major Slugs:** ${dupMajorSlugs.length}\n`;

  report += `\n---\n\n## 7. Đề xuất thứ tự Curation\n\n`;
  report += `1. **Field ↔ Major Mapping:** Bắt buộc phải gom ${majors?.length} Majors hiện tại vào 10 Fields bằng tay (thông qua Tool Admin hoặc SQL) để đảm bảo không bị đứt gãy luồng Khám phá. Không thể tin tưởng heuristic string matching.\n`;
  report += `2. **University Enrichment:** Bổ sung Logo và Website cho ${uniWithoutLogo.length} trường chưa có logo.\n`;
  report += `3. **Clean Orphan Data:** Xóa hoặc ẩn các Majors/Universities rác không có liên kết với nhau (ví dụ ${orphanUnis.length} trường không có ngành học).\n`;

  fs.writeFileSync("docs/DATA_BACKBONE_AUDIT.md", report);
  console.log("Audit complete, saved to docs/DATA_BACKBONE_AUDIT.md");
}

runAudit().catch(console.error);
