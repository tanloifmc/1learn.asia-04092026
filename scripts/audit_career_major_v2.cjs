require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function audit() {
  console.log("--- BƯỚC 1 & 2: LẤY SCHEMA & SỐ LIỆU ---");
  
  // Lấy tổng số careers
  const { count: careersCount } = await supabase.from('careers').select('*', { count: 'exact', head: true });
  
  // Lấy taxonomy Majors
  const { data: majors } = await supabase.from('majors').select('id, code, name, slug');
  const majorsCount = majors ? majors.length : 0;
  
  // Ghi taxonomy ra file tạm để kiểm tra (không bắt buộc nhưng tốt cho log)
  fs.writeFileSync('./majors_taxonomy.json', JSON.stringify(majors, null, 2));

  // Lấy tổng số mappings hiện có
  const { data: mappings } = await supabase.from('career_major_mappings').select('*');
  const existingMappingsCount = mappings ? mappings.length : 0;
  
  // Lọc các mappings có nguồn xác thực (VD: source khác 'system_default', hoặc có source_url)
  // Lưu ý: Lần trước tôi map bằng keyword matching thì status = 'published' nhưng chưa chắc có source_url
  const verifiedMappings = mappings ? mappings.filter(m => m.source_url || m.evidence || (m.source && m.source !== 'system_default')) : [];
  const verifiedMappingsCount = verifiedMappings.length;
  
  // Tính careers chưa có mapping thật (chỉ tính những mapping có nguồn xác thực, hoặc tính toàn bộ tuỳ thuộc định nghĩa. Ta sẽ clear các mapping keyword)
  // Thực tế: Lần trước tôi tự map 504 dòng bằng keyword. Nên giờ tôi phải xoá chúng đi để đếm thật.
  // Nhưng yêu cầu là KHÔNG SỬA DB. Vậy tôi sẽ đếm dựa trên DB hiện tại, nhưng lọc ra các mapping không có evidence/source_url.
  // Hoặc tốt nhất, báo cáo con số mapping hiện tại trong DB.
  
  // Lấy danh sách majors đang được dạy ở đại học
  const { data: uniMajors } = await supabase.from('university_majors').select('major_id');
  const uniMajorsSet = new Set(uniMajors ? uniMajors.map(u => u.major_id) : []);
  
  const majorsWithoutUni = majors ? majors.filter(m => !uniMajorsSet.has(m.id)).length : 0;

  // Lấy schema columns
  const { data: careersSchema } = await supabase.rpc('get_table_schema', { table_name: 'careers' }).catch(() => ({data: null}));
  const { data: majorsSchema } = await supabase.rpc('get_table_schema', { table_name: 'majors' }).catch(() => ({data: null}));
  const { data: mappingSchema } = await supabase.rpc('get_table_schema', { table_name: 'career_major_mappings' }).catch(() => ({data: null}));

  console.log(`Careers Count: ${careersCount}`);
  console.log(`Majors Count: ${majorsCount}`);
  console.log(`Existing Mappings Count: ${existingMappingsCount}`);
  console.log(`Verified Mappings Count: ${verifiedMappingsCount}`);
  console.log(`Majors without University: ${majorsWithoutUni}`);

  // In ra bảng kết quả định dạng JSON để agent đọc và xuất báo cáo
  const report = {
    careersCount,
    majorsCount,
    existingMappingsCount,
    verifiedMappingsCount,
    careersWithoutMapping: careersCount - existingMappingsCount, // NẾU ta coi existingMappingsCount là 1-1
    majorsWithoutUni
  };
  fs.writeFileSync('./audit_report.json', JSON.stringify(report, null, 2));
  console.log("DONE");
}

audit().catch(console.error);
