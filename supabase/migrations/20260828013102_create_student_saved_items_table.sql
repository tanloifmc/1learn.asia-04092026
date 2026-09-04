-- Migration: create_student_saved_items_table
-- Purpose: Cung cấp bảng lưu trữ các nghề/ngành/trường mà học sinh Đang cân nhắc (Considering) trong Explore

CREATE TABLE IF NOT EXISTS public.student_saved_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_type text NOT NULL CHECK (item_type IN ('career', 'major', 'university')),
    item_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint để tránh lưu trùng cùng một item cho một học sinh
ALTER TABLE public.student_saved_items 
    ADD CONSTRAINT student_saved_items_unique_item UNIQUE (student_id, item_type, item_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_saved_items_student_id ON public.student_saved_items(student_id);
CREATE INDEX IF NOT EXISTS idx_student_saved_items_item_type ON public.student_saved_items(item_type);

-- RLS
ALTER TABLE public.student_saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own saved items"
    ON public.student_saved_items
    FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own saved items"
    ON public.student_saved_items
    FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete their own saved items"
    ON public.student_saved_items
    FOR DELETE
    USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all saved items"
    ON public.student_saved_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
        )
    );
