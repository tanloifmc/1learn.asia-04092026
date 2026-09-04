-- Phase 17: MVP Reset - Field Taxonomy

-- 1. Create fields table
CREATE TABLE IF NOT EXISTS public.fields (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    icon text,
    display_order integer DEFAULT 0,
    active boolean DEFAULT true,
    riasec_mapping text, -- Used for simple recommendation (e.g. 'R', 'I', 'A')
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read fields" ON public.fields FOR SELECT USING (active = true);

-- 2. Modify majors table to link to fields
-- Add field_id to majors (since currently it has a text column named "field")
ALTER TABLE public.majors ADD COLUMN IF NOT EXISTS field_id uuid REFERENCES public.fields(id);

-- 3. Seed minimum Fields for MVP
INSERT INTO public.fields (name, slug, description, icon, display_order, riasec_mapping) VALUES
('Công nghệ & Kỹ thuật', 'cong-nghe-ky-thuat', 'Các ngành liên quan đến máy tính, phần mềm, cơ khí, tự động hóa và kỹ thuật ứng dụng.', 'laptop', 1, 'R,I'),
('Kinh doanh & Quản lý', 'kinh-doanh-quan-ly', 'Các ngành về quản trị doanh nghiệp, tài chính, marketing, và nhân sự.', 'briefcase', 2, 'E,C'),
('Thiết kế & Sáng tạo', 'thiet-ke-sang-tao', 'Các ngành liên quan đến nghệ thuật, đồ họa, thiết kế thời trang, và kiến trúc.', 'palette', 3, 'A'),
('Truyền thông & Báo chí', 'truyen-thong-bao-chi', 'Các ngành báo chí, truyền thông đa phương tiện, quan hệ công chúng.', 'mic', 4, 'A,E'),
('Khoa học & Nghiên cứu', 'khoa-hoc-nghien-cuu', 'Các ngành khoa học cơ bản, sinh học, hóa học, vật lý và môi trường.', 'flask-conical', 5, 'I'),
('Giáo dục & Xã hội', 'giao-duc-xa-hoi', 'Sư phạm, tâm lý học, xã hội học và các ngành phục vụ cộng đồng.', 'book-open', 6, 'S'),
('Y tế & Sức khỏe', 'y-te-suc-khoe', 'Y khoa, dược học, điều dưỡng và các dịch vụ chăm sóc sức khỏe.', 'heart-pulse', 7, 'I,S'),
('Luật & Hành chính', 'luat-hanh-chinh', 'Luật kinh tế, luật quốc tế, hành chính công.', 'scale', 8, 'E,C'),
('Dịch vụ & Du lịch', 'dich-vu-du-lich', 'Quản trị khách sạn, du lịch, nhà hàng và sự kiện.', 'plane', 9, 'S,E'),
('Nông lâm ngư nghiệp', 'nong-lam-ngu-nghiep', 'Nông nghiệp công nghệ cao, lâm nghiệp, thú y.', 'leaf', 10, 'R')
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name, 
    description = EXCLUDED.description, 
    riasec_mapping = EXCLUDED.riasec_mapping;

-- 4. Simple trigger for updated_at
CREATE OR REPLACE FUNCTION update_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_fields_updated_at ON public.fields;
CREATE TRIGGER update_fields_updated_at
    BEFORE UPDATE ON public.fields
    FOR EACH ROW
    EXECUTE FUNCTION update_fields_updated_at();

-- 5. Link existing Majors to Fields (Naive matching based on existing text field if possible, else random or null)
-- For the sake of MVP, we update some existing majors to link to these fields.
UPDATE public.majors m 
SET field_id = f.id
FROM public.fields f
WHERE m.field ILIKE '%' || f.name || '%' AND m.field_id IS NULL;

-- 6. Add target field_id to student_goals
ALTER TABLE public.student_goals ADD COLUMN IF NOT EXISTS field_id uuid REFERENCES public.fields(id);

