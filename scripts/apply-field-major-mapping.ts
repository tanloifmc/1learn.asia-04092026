import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const mapping: Record<string, string> = {
  "an-toan-thong-tin": "cong-nghe-ky-thuat",
  "cong-nghe-thong-tin": "cong-nghe-ky-thuat",
  "he-thong-thong-tin": "cong-nghe-ky-thuat",
  "khoa-hoc-du-lieu": "cong-nghe-ky-thuat",
  "khoa-hoc-may-tinh": "cong-nghe-ky-thuat",
  "ky-thuat-phan-mem": "cong-nghe-ky-thuat",
  "tri-tue-nhan-tao": "cong-nghe-ky-thuat",
  "thuong-mai-dien-tu": "kinh-doanh-quan-ly", 
  "ky-thuat-co-khi": "cong-nghe-ky-thuat",
  "ky-thuat-dien": "cong-nghe-ky-thuat",
  "ky-thuat-dien-tu-vien-thong": "cong-nghe-ky-thuat",
  "ky-thuat-hoa-hoc": "cong-nghe-ky-thuat",
  "ky-thuat-moi-truong": "cong-nghe-ky-thuat",
  "ky-thuat-xay-dung": "cong-nghe-ky-thuat",
  "bao-hiem": "kinh-doanh-quan-ly",
  "ke-toan": "kinh-doanh-quan-ly",
  "kiem-toan": "kinh-doanh-quan-ly",
  "kinh-te-hoc": "kinh-doanh-quan-ly",
  "kinh-te-quoc-te": "kinh-doanh-quan-ly",
  "logistics-chuoi-cung-ung": "kinh-doanh-quan-ly",
  "marketing": "kinh-doanh-quan-ly",
  "quan-tri-kinh-doanh": "kinh-doanh-quan-ly",
  "tai-chinh-ngan-hang": "kinh-doanh-quan-ly",
  "kien-truc": "thiet-ke-sang-tao",
  "my-thuat-ung-dung": "thiet-ke-sang-tao",
  "thiet-ke-do-hoa": "thiet-ke-sang-tao",
  "thiet-ke-noi-that": "thiet-ke-sang-tao",
  "bao-chi": "truyen-thong-bao-chi",
  "truyen-thong-da-phuong-tien": "truyen-thong-bao-chi",
  "cong-nghe-sinh-hoc": "khoa-hoc-nghien-cuu",
  "khoa-hoc-moi-truong": "khoa-hoc-nghien-cuu",
  "cong-tac-xa-hoi": "giao-duc-xa-hoi",
  "giao-duc-mam-non": "giao-duc-xa-hoi",
  "ngon-ngu-anh": "giao-duc-xa-hoi",
  "ngon-ngu-nhat": "giao-duc-xa-hoi",
  "ngon-ngu-trung-quoc": "giao-duc-xa-hoi",
  "quan-he-quoc-te": "giao-duc-xa-hoi",
  "su-pham-tieng-anh": "giao-duc-xa-hoi",
  "su-pham-toan-hoc": "giao-duc-xa-hoi",
  "tam-ly-hoc": "giao-duc-xa-hoi",
  "dieu-duong": "y-te-suc-khoe",
  "duoc-hoc": "y-te-suc-khoe",
  "rang-ham-mat": "y-te-suc-khoe",
  "y-khoa": "y-te-suc-khoe",
  "luat": "luat-hanh-chinh",
  "luat-kinh-te": "luat-hanh-chinh",
  "quan-tri-du-lich-lu-hanh": "dich-vu-du-lich",
  "quan-tri-khach-san": "dich-vu-du-lich",
  "nong-nghiep": "nong-lam-ngu-nghiep",
  "thu-y": "nong-lam-ngu-nghiep"
};

async function applyMapping() {
  console.log("Starting Field -> Major mapping...");

  // 1. Get Fields
  const { data: fields, error: errFields } = await supabase.from("fields").select("id, slug");
  if (errFields) { console.error(errFields); return; }

  const fieldSlugToId: Record<string, string> = {};
  fields.forEach(f => fieldSlugToId[f.slug] = f.id);

  // 2. Get Majors
  const { data: majors, error: errMajors } = await supabase.from("majors").select("id, slug");
  if (errMajors) { console.error(errMajors); return; }

  // 3. Verify mappings
  if (Object.keys(mapping).length !== 50) {
    console.error("Mapping object does not contain exactly 50 entries!");
    return;
  }

  let mappedCount = 0;
  for (const major of majors) {
    const targetFieldSlug = mapping[major.slug];
    if (!targetFieldSlug) {
      console.error(`Major slug not found in mapping: ${major.slug}`);
      continue;
    }
    const targetFieldId = fieldSlugToId[targetFieldSlug];
    if (!targetFieldId) {
      console.error(`Target field slug not found in DB: ${targetFieldSlug}`);
      continue;
    }

    const { error } = await supabase.from("majors").update({ field_id: targetFieldId }).eq("id", major.id);
    if (error) {
      console.error(`Error updating ${major.slug}:`, error.message);
    } else {
      mappedCount++;
    }
  }

  console.log(`Updated ${mappedCount} / 50 majors.`);

  // 4. Integrity Check
  const { data: finalMajors } = await supabase.from("majors").select("id, field_id");
  const orphans = finalMajors?.filter(m => !m.field_id) || [];
  
  const fieldCounts: Record<string, number> = {};
  finalMajors?.forEach(m => {
    if (m.field_id) {
      fieldCounts[m.field_id] = (fieldCounts[m.field_id] || 0) + 1;
    }
  });

  let emptyFields = 0;
  fields.forEach(f => {
    if (!fieldCounts[f.id]) {
      emptyFields++;
      console.warn(`Field ${f.slug} has no majors!`);
    }
  });

  console.log("=== INTEGRITY CHECK ===");
  console.log(`Orphan Majors: ${orphans.length}`);
  console.log(`Empty Fields: ${emptyFields}`);
}

applyMapping().catch(console.error);
