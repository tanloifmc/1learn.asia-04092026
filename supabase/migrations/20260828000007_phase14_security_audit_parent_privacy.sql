-- Phase 14: Fix Parent Privacy for detailed roadmap tasks
-- Level 1 (Overview) should not be able to read roadmap_tasks.
-- Only Level 2 (Detailed) or higher can read roadmap_tasks.

DROP POLICY IF EXISTS "Parents can view tasks" ON public.roadmap_tasks;
CREATE POLICY "Parents can view tasks" ON public.roadmap_tasks FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.roadmap_milestones m
        JOIN public.roadmaps r ON r.id = m.roadmap_id
        WHERE m.id = milestone_id
          AND public.get_parent_permission_level(auth.uid(), r.student_id, 'roadmap') >= 2
    )
);
