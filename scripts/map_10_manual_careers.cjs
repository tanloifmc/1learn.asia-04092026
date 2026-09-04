const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function run() {
  // 10 Careers to Map
  const mappings = [
    { career_code: 'SOFTWARE_ENGINEER', major_slugs: ['khoa-hoc-may-tinh', 'ky-thuat-phan-mem', 'cong-nghe-thong-tin'] },
    { career_code: 'DATA_SCIENTIST', major_slugs: ['khoa-hoc-du-lieu', 'he-thong-thong-tin'] },
    { career_code: 'GENERAL_PRACTITIONER', major_slugs: ['y-khoa', 'y-da-khoa'] }, // Note: we'll check if these exist
    { career_code: 'ACCOUNTANT', major_slugs: ['ke-toan', 'kiem-toan'] }, // Example code
    { career_code: 'MARKETING_MANAGER', major_slugs: ['marketing', 'quan-tri-kinh-doanh'] },
    { career_code: 'LAWYER', major_slugs: ['luat', 'luat-kinh-te'] },
    { career_code: 'TOUR_GUIDE', major_slugs: ['quan-tri-du-lich-lu-hanh'] },
    { career_code: 'ENGLISH_TEACHER', major_slugs: ['ngon-ngu-anh'] },
    { career_code: 'FINANCIAL_ANALYST', major_slugs: ['tai-chinh-ngan-hang'] },
    { career_code: 'HR_MANAGER', major_slugs: ['quan-tri-nhan-luc'] } // If not exists, will skip
  ];

  for (const m of mappings) {
    // get career
    const cRes = await pool.query('SELECT id, name FROM careers WHERE code = $1', [m.career_code]);
    if (cRes.rows.length === 0) continue;
    const career = cRes.rows[0];

    for (const slug of m.major_slugs) {
      const mRes = await pool.query('SELECT id, name FROM majors WHERE slug = $1', [slug]);
      if (mRes.rows.length === 0) continue;
      const major = mRes.rows[0];

      // Insert mapping
      await pool.query(`
        INSERT INTO career_major_mappings (career_id, major_id, relationship_type, relevance_score, source, status)
        VALUES ($1, $2, 'primary', 0.95, 'E2E_AUDIT_MANUAL', 'published')
        ON CONFLICT (career_id, major_id) DO UPDATE SET status = 'published'
      `, [career.id, major.id]);

      console.log(`Mapped [${career.name}] -> [${major.name}]`);
    }
  }

  await pool.end();
}
run();
