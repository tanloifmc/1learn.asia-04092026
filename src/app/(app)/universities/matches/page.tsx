import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function UniversityMatchesPage({ searchParams }: { searchParams: Promise<{ major?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { major: majorFilter } = await searchParams;

  // 1. Fetch latest recommendation run for this student
  const { data: run, error: runError } = await supabase
    .from("university_recommendation_runs")
    .select("*, student_university_recommendations(*, universities(*), majors(*))")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (runError || !run) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Gợi ý Trường Đại học</h1>
        <p className="text-gray-500 mb-8">Bạn chưa có dữ liệu phân tích khả năng trúng tuyển.</p>
        <Link href="/me/kham-pha" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90">
          Làm bài test hướng nghiệp
        </Link>
      </div>
    );
  }

  const recommendations = run.student_university_recommendations || [];
  
  // Filter by major if requested
  const filteredRecs = majorFilter 
    ? recommendations.filter((r: any) => r.majors?.slug === majorFilter)
    : recommendations;

  // Check if we have insufficient data (Grade 10/11 case)
  const isInsufficient = recommendations.length > 0 && recommendations.every((r: any) => r.tier === 'Insufficient Data' || r.tier === 'Unrated');

  if (isInsufficient) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Định Hướng Mục Tiêu</h1>
        <p className="text-gray-600 mb-8">
          Hiện tại hệ thống chưa đủ dữ liệu điểm thực tế (hoặc điểm quy đổi hợp lệ) để dự báo khả năng trúng tuyển của bạn.
          Dưới đây là mục tiêu điểm chuẩn bạn cần hướng tới.
        </p>

        <div className="space-y-6">
          {filteredRecs.map((rec: any) => (
            <div key={rec.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
              <h2 className="text-xl font-semibold">{rec.universities.name}</h2>
              <p className="text-primary font-medium">{rec.majors.name}</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500">Mục tiêu điểm chuẩn (tham khảo các năm {rec.historical_years_used.join(', ')}):</p>
                <p className="text-2xl font-bold mt-1 text-gray-800">
                  {rec.fit_breakdown?.latest_cutoff || 'Đang cập nhật'} 
                  <span className="text-sm font-normal text-gray-500 ml-2">({rec.admission_method})</span>
                </p>
                {rec.fit_breakdown?.trend && (
                  <p className="text-sm mt-2 flex items-center gap-1">
                    Xu hướng: <span className="capitalize">{rec.fit_breakdown.trend}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Normal view (Dream / Match / Safer Option)
  const dream = filteredRecs.filter((r: any) => r.tier === 'Dream');
  const match = filteredRecs.filter((r: any) => r.tier === 'Match');
  const safe = filteredRecs.filter((r: any) => r.tier === 'Safer Option');

  const renderTier = (title: string, desc: string, items: any[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-4">{desc}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{item.universities.short_name || item.universities.name}</h3>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Fit: {item.admission_fit_score}/100
                </span>
              </div>
              <p className="text-gray-600 font-medium mb-3">{item.majors.name}</p>
              
              <div className="text-sm text-gray-500 space-y-1 border-t pt-3">
                <div className="flex justify-between">
                  <span>Khoảng cách điểm:</span>
                  <span className={item.fit_breakdown.admission_gap < 0 ? 'text-red-500' : 'text-green-600'}>
                    {item.fit_breakdown.admission_gap > 0 ? '+' : ''}{item.fit_breakdown.admission_gap}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Phương thức:</span>
                  <span>{item.admission_method}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dữ liệu lịch sử:</span>
                  <span>{item.historical_years_used.length} năm ({item.data_quality})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold mb-2">Đề xuất Trường Đại học</h1>
        <p className="text-gray-600">
          Dựa trên hồ sơ của bạn (v.{run.profile_version}) và dữ liệu điểm chuẩn lịch sử. 
          <span className="block mt-1 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
            Lưu ý: Kết quả phân loại mang tính tham khảo dựa trên dữ liệu các năm trước, không đảm bảo kết quả trúng tuyển thực tế của năm nay.
          </span>
        </p>
      </div>

      {renderTier('Safer Option (Biên an toàn cao)', 'Điểm của bạn cao hơn khá nhiều so với mức điểm chuẩn lịch sử, khả năng đậu cao nếu xu hướng không biến động đột biến.', safe)}
      {renderTier('Match (Phù hợp)', 'Điểm của bạn ngang bằng hoặc cao hơn nhẹ so với điểm chuẩn lịch sử. Đây là các lựa chọn vừa sức.', match)}
      {renderTier('Dream (Mục tiêu cao)', 'Điểm của bạn hiện đang thấp hơn điểm chuẩn lịch sử. Cần nỗ lực cải thiện hoặc theo dõi biến động điểm.', dream)}
      
    </div>
  );
}
