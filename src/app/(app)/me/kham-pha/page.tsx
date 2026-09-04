import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AssessmentEngine, type AssessmentQuestion } from "@/features/assessment/components/assessment-engine";

export default async function KhamPhaPage({ searchParams }: { searchParams: { new?: string } }) {
  const account = await getCurrentAccount();
  const user = account ? { id: account.userId } : null;
  if (!user) redirect("/login");

  const supabase = await createClient();

  // 1. Fetch the published version (V2026.1)
  const { data: version } = await supabase
    .from("assessment_versions")
    .select("id")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!version) {
    return (
      <div className="pb-12">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-amber-800">
          <h2 className="font-bold text-xl mb-2">Hệ thống đang cập nhật</h2>
          <p>Bộ câu hỏi khám phá đang được chuẩn bị. Vui lòng quay lại sau.</p>
        </div>
      </div>
    );
  }

  // 2. Fetch or create session for this student + version
  let { data: currentSession } = await supabase
    .from("assessment_sessions")
    .select("id, status")
    .eq("student_id", user.id)
    .eq("version_id", version.id)
    .eq("status", "in_progress")
    .maybeSingle();

  // If already completed and not requesting a new one → redirect to report
  // If they want to force a new one, they can pass ?new=1 in the URL (to be implemented on UI side)
  // For now, if they have a completed session, we redirect to report unless we change this logic.
  const { data: completedSession } = await supabase
    .from("assessment_sessions")
    .select("id")
    .eq("student_id", user.id)
    .eq("version_id", version.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const forceNew = searchParams?.new === '1';

  // Temporary: we will let them bypass this if they click "Làm lại bài khảo sát" which can pass a query param.
  // We'll leave the basic redirect, but if we need a new session, we skip this block.
  if (completedSession && !forceNew) {
    redirect("/me/bao-cao");
  }

  if (!currentSession) {
    // Check 12 reports per year limit
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const { count, error: countError } = await supabase
      .from("student_reports")
      .select("*", { count: "exact", head: true })
      .eq("student_id", user.id)
      .gte("created_at", oneYearAgo.toISOString());

    if (count && count >= 12) {
      return (
        <div className="pb-12 max-w-2xl mx-auto pt-20">
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-red-800 text-center shadow-sm">
            <h2 className="font-bold text-2xl mb-4 text-red-900">Đã đạt giới hạn khảo sát</h2>
            <p className="text-lg mb-6">Bạn đã thực hiện {count} bài khảo sát trong năm nay. Theo quy định để đảm bảo chất lượng hướng nghiệp, mỗi học sinh chỉ được làm tối đa 12 bài khảo sát/năm.</p>
            <Link href="/me/bao-cao" className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors">
              Xem báo cáo hiện tại
            </Link>
          </div>
        </div>
      );
    }

    const { data: newSession, error: sessionError } = await supabase
      .from("assessment_sessions")
      .insert({ student_id: user.id, version_id: version.id, status: "in_progress" })
      .select("id, status")
      .single();

    if (sessionError || !newSession) {
      return <div className="pb-12 text-red-600">Lỗi tạo phiên làm bài. Vui lòng tải lại trang.</div>;
    }
    currentSession = newSession;
  }

  // 3. Fetch all 121 questions with their dimension metadata
  // NOTE: RLS policy "Student reads questions via session" will allow this since session is in_progress
  const { data: questionsRaw, error: qError } = await supabase
    .from("assessment_questions")
    .select(`
      id,
      question_code,
      module,
      order_index,
      question_text,
      is_reverse_scored,
      assessment_dimensions!inner(
        id,
        code,
        framework,
        name,
        matching_role
      )
    `)
    .eq("version_id", version.id)
    .order("order_index", { ascending: true });

  if (qError || !questionsRaw || questionsRaw.length === 0) {
    console.error("Error fetching questions:", qError);
    return <div className="pb-12 text-red-600">Không thể tải câu hỏi. Vui lòng tải lại trang.</div>;
  }

  // 4. Fetch existing responses (for resume support)
  const { data: existingResponses } = await supabase
    .from("assessment_responses")
    .select("question_id, response_value")
    .eq("session_id", currentSession.id);

  const initialAnswers: Record<string, number> = {};
  for (const r of existingResponses ?? []) {
    initialAnswers[r.question_id] = r.response_value;
  }

  // 5. Transform questions to typed format
  const questions: AssessmentQuestion[] = questionsRaw.map((q: any) => ({
    id: q.id,
    question_code: q.question_code,
    module: q.module,
    order_index: q.order_index,
    question_text: q.question_text,
    is_reverse_scored: q.is_reverse_scored,
    dimension: {
      id: q.assessment_dimensions.id,
      code: q.assessment_dimensions.code,
      framework: q.assessment_dimensions.framework,
      name: q.assessment_dimensions.name,
      matching_role: q.assessment_dimensions.matching_role,
    },
  }));

  const answeredCount = Object.keys(initialAnswers).length;

  return (
    <div className="space-y-10 pb-16">
      <header>
        <h1 className="font-serif text-5xl text-[#0E1B3D] mb-4">Khám phá Bản thân</h1>
        <p className="text-lg text-[#0E1B3D]/60 font-light max-w-2xl leading-relaxed">
          Bài đánh giá được chia làm 5 nhóm với 121 câu hỏi để giúp hệ thống hiểu em một cách toàn diện. 
          Không có câu trả lời đúng hay sai. Tiến trình sẽ được tự động lưu lại mỗi khi em chọn đáp án.
        </p>
      </header>

      <AssessmentEngine
        sessionId={currentSession.id}
        questions={questions}
        initialAnswers={initialAnswers}
      />

      <p className="text-center text-xs text-[#0E1B3D]/30 italic">
        Kết quả đánh giá mang tính định hướng và khám phá, không phải kết luận về khả năng hay quyết định nghề nghiệp của em.
      </p>
    </div>
  );
}
