"use client";

import React, { useState, useCallback, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { saveAssessmentResponse } from "../actions/session";
import { calculateAndCompleteSession } from "../actions/scoring";
import { CheckCircle2, ChevronRight, Loader2, Save } from "lucide-react";

// Scale labels per module context
const LIKERT_LABELS_AGREEMENT = [
  { value: 1, label: "Hoàn toàn không đúng" },
  { value: 2, label: "Không đúng lắm" },
  { value: 3, label: "Phân vân / khó nói" },
  { value: 4, label: "Khá đúng" },
  { value: 5, label: "Rất đúng với tôi" },
];

const LIKERT_LABELS_IMPORTANCE = [
  { value: 1, label: "Không quan trọng" },
  { value: 2, label: "Ít quan trọng" },
  { value: 3, label: "Bình thường" },
  { value: 4, label: "Quan trọng" },
  { value: 5, label: "Rất quan trọng" },
];

const LIKERT_LABELS_ATTENTION = [
  { value: 1, label: "Mức 1" },
  { value: 2, label: "Mức 2" },
  { value: 3, label: "Mức 3" },
  { value: 4, label: "Mức 4" },
  { value: 5, label: "Mức 5" },
];

function getLikertLabels(module: string) {
  if (module === 'work_values') return LIKERT_LABELS_IMPORTANCE;
  if (module === 'validity') return LIKERT_LABELS_ATTENTION;
  return LIKERT_LABELS_AGREEMENT;
}

export interface AssessmentQuestion {
  id: string;
  question_code: string;
  module: string;
  order_index: number;
  question_text: string;
  is_reverse_scored: boolean;
  dimension: {
    id: string;
    code: string;
    framework: string;
    name: string;
    matching_role: string;
  };
}

interface AssessmentEngineProps {
  sessionId: string;
  questions: AssessmentQuestion[];
  initialAnswers?: Record<string, number>;
}

const MODULE_META: Record<string, { title: string; description: string; color: string; bg: string }> = {
  riasec: {
    title: "Sở thích nghề nghiệp",
    description: "Nhóm câu hỏi này giúp khám phá em thích làm những công việc gì. Đừng quan tâm đến việc em có khả năng hay không, hãy chỉ chọn mức độ em thấy HỨNG THÚ với các hoạt động dưới đây.",
    color: "#0E1B3D",
    bg: "bg-[#0E1B3D]"
  },
  big_five: {
    title: "Tính cách cá nhân",
    description: "Nhóm câu hỏi này giúp hiểu rõ đặc điểm tính cách của em. Hãy chọn mức độ mô tả ĐÚNG NHẤT về cách em thường suy nghĩ, cảm nhận và hành động trong cuộc sống hàng ngày.",
    color: "#1a3a6b",
    bg: "bg-[#1a3a6b]"
  },
  work_values: {
    title: "Giá trị nghề nghiệp",
    description: "Nhóm câu hỏi này tìm hiểu điều gì là QUAN TRỌNG NHẤT đối với em khi đi làm sau này. Môi trường làm việc như thế nào sẽ khiến em hài lòng?",
    color: "#B89862",
    bg: "bg-[#B89862]"
  },
  career_readiness: {
    title: "Mức độ sẵn sàng",
    description: "Nhóm câu hỏi này đánh giá mức độ em đã tự tìm hiểu và chuẩn bị cho việc chọn ngành, chọn nghề của bản thân.",
    color: "#2d6a4f",
    bg: "bg-[#2d6a4f]"
  },
  validity: {
    title: "Câu hỏi kiểm tra",
    description: "Vài câu hỏi cuối cùng để đảm bảo hệ thống đánh giá chính xác sự tập trung của em trong quá trình trả lời.",
    color: "#555555",
    bg: "bg-[#555555]"
  },
};

const MODULE_ORDER = ["riasec", "big_five", "work_values", "career_readiness", "validity"];

export function AssessmentEngine({ sessionId, questions, initialAnswers = {} }: AssessmentEngineProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
  const [savingQuestions, setSavingQuestions] = useState<Record<string, boolean>>({});
  const [isSubmitting, startTransition] = useTransition();
  const [isComplete, setIsComplete] = useState(false);
  const [requiresRetake, setRequiresRetake] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group questions by module
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, AssessmentQuestion[]> = {};
    for (const q of questions) {
      if (!groups[q.module]) groups[q.module] = [];
      groups[q.module].push(q);
    }
    return groups;
  }, [questions]);

  // Determine initial tab (the first module that is not fully answered)
  const initialModule = useMemo(() => {
    for (const mod of MODULE_ORDER) {
      const qs = groupedQuestions[mod] || [];
      const answeredInMod = qs.filter(q => initialAnswers[q.id] !== undefined).length;
      if (answeredInMod < qs.length) return mod;
    }
    return MODULE_ORDER[0];
  }, [groupedQuestions, initialAnswers]);

  const [activeTab, setActiveTab] = useState<string>(initialModule);

  const totalAnswered = Object.keys(answers).length;
  const progress = Math.round((totalAnswered / questions.length) * 100);

  const handleSelect = useCallback(async (questionId: string, value: number) => {
    if (savingQuestions[questionId]) return;

    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setSavingQuestions(prev => ({ ...prev, [questionId]: true }));
    setError(null);

    try {
      const result = await saveAssessmentResponse(sessionId, questionId, value);
      if (!result.success) {
        setError("Lỗi lưu câu trả lời. Vui lòng thử lại.");
        setAnswers(prev => {
          const next = { ...prev };
          delete next[questionId];
          return next;
        });
      }
    } catch {
      setError("Mất kết nối. Vui lòng kiểm tra internet và thử lại.");
    } finally {
      setSavingQuestions(prev => ({ ...prev, [questionId]: false }));
    }
  }, [sessionId, savingQuestions]);

  const handleSubmit = useCallback(() => {
    if (totalAnswered < questions.length) {
      setError("Vui lòng hoàn thành tất cả các câu hỏi trước khi nộp bài.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await calculateAndCompleteSession(sessionId);
        if (result.success) {
          if (result.requiresRetake) {
            setRequiresRetake(true);
            return;
          }
          setIsComplete(true);
          setTimeout(() => {
            router.push('/me/bao-cao');
          }, 2500);
        } else if (result.error === "Session already completed") {
          setIsComplete(true);
          setTimeout(() => {
            router.push('/me/bao-cao');
          }, 1000);
        } else {
          setError(`Lỗi tính điểm: ${result.error}`);
        }
      } catch (err: any) {
        console.error("Submit error (timeout?):", err);
        // If it's a timeout, the DB might have already saved the result.
        setError("Quá thời gian kết nối. Hệ thống có thể đã lưu kết quả, vui lòng làm mới trang (F5) hoặc vào mục Báo cáo.");
      }
    });
  }, [sessionId, router, totalAnswered, questions.length]);

  if (isComplete) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-8 animate-bounce">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </div>
        <h2 className="font-serif text-4xl text-[#0E1B3D] mb-4">Hoàn thành!</h2>
        <p className="text-[#0E1B3D]/60 text-lg mb-2">Hệ thống đang phân tích kết quả của em...</p>
        <p className="text-[#0E1B3D]/40 text-sm">Đang chuyển đến Báo cáo...</p>
        <div className="mt-8 flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-[#B89862] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (requiresRetake) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mb-8">
          <CheckCircle2 className="w-12 h-12 text-amber-700" />
        </div>
        <h2 className="font-serif text-4xl text-[#0E1B3D] mb-4">Cần làm lại bài đánh giá</h2>
        <p className="text-[#0E1B3D]/60 text-lg mb-8 max-w-xl">
          Hệ thống đã lưu bài làm nhưng chưa thể xác nhận độ tin cậy của kết quả. Em hãy làm lại cẩn thận để nhận được báo cáo định hướng phù hợp.
        </p>
        <button
          onClick={() => router.push('/me/kham-pha?new=1')}
          className="px-8 py-4 rounded-full bg-[#0E1B3D] text-white font-bold hover:bg-[#B89862] transition-colors"
        >
          Làm lại bài đánh giá
        </button>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <Loader2 className="w-16 h-16 text-[#B89862] animate-spin mb-6" />
        <h2 className="font-serif text-3xl text-[#0E1B3D] mb-3">Đang tính điểm...</h2>
        <p className="text-[#0E1B3D]/60">Hệ thống AI đang phân tích hồ sơ của em.</p>
      </div>
    );
  }

  const activeQuestions = groupedQuestions[activeTab] || [];
  const labels = getLikertLabels(activeTab);
  const activeMeta = MODULE_META[activeTab];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Overall Progress and Save Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-[24px] shadow-sm border border-[#0E1B3D]/5">
        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-[#0E1B3D] uppercase tracking-wider">
              Tiến độ bài làm
            </span>
            <span className="text-sm font-bold text-[#B89862]">{totalAnswered} / {questions.length} câu</span>
          </div>
          <div className="w-full h-3 bg-[#0E1B3D]/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#B89862] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => router.push('/')}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-[#0E1B3D]/10 text-[#0E1B3D] font-bold hover:bg-[#0E1B3D]/5 transition-colors shrink-0 w-full md:w-auto"
        >
          <Save className="w-4 h-4" />
          Lưu tiến trình & Trở về
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Module Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {MODULE_ORDER.map(mod => {
          if (!groupedQuestions[mod] || groupedQuestions[mod].length === 0) return null;
          const isActive = activeTab === mod;
          const meta = MODULE_META[mod];
          const answeredInMod = groupedQuestions[mod].filter(q => q.id in answers).length;
          const isModComplete = answeredInMod === groupedQuestions[mod].length;

          return (
            <button
              key={mod}
              onClick={() => setActiveTab(mod)}
              className={`flex-1 min-w-[140px] px-4 py-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                isActive
                  ? `border-[#0E1B3D] bg-[#0E1B3D] shadow-md`
                  : `border-[#0E1B3D]/10 bg-white hover:border-[#0E1B3D]/30`
              }`}
            >
              {isActive && (
                <div className={`absolute top-0 left-0 w-full h-1 ${meta.bg}`} />
              )}
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-[#0E1B3D]/70'}`}>
                  {meta.title}
                </span>
                {isModComplete && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
              </div>
              <p className={`text-xs font-medium ${isActive ? 'text-white/60' : 'text-[#0E1B3D]/40'}`}>
                {answeredInMod} / {groupedQuestions[mod].length} câu
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Module Content */}
      <div className="bg-white rounded-[32px] border border-[#0E1B3D]/8 shadow-[0_20px_60px_rgba(14,27,61,0.04)] overflow-hidden mb-8">
        
        {/* Legend Header */}
        <div className="px-6 md:px-12 py-8 md:py-10 border-b border-[#0E1B3D]/5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-2 h-8 rounded-full ${activeMeta.bg}`}></div>
            <h2 className="font-serif text-3xl text-[#0E1B3D]">{activeMeta.title}</h2>
          </div>
          <p className="text-[#0E1B3D]/70 text-sm md:text-base max-w-3xl mb-8 leading-relaxed pl-5">
            {activeMeta.description}
          </p>
          
          <div className="bg-[#0E1B3D]/5 rounded-2xl p-6 ml-0 md:ml-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0E1B3D]/40 mb-4">Quy ước mức độ điểm:</p>
            <div className="grid grid-cols-5 gap-2 md:gap-4">
              {labels.map(l => (
                <div key={l.value} className="text-center flex flex-col items-center">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center font-bold text-[#0E1B3D] mb-2 shadow-sm border border-[#0E1B3D]/5 transition-transform hover:scale-110">
                    {l.value}
                  </div>
                  <span className="text-[10px] md:text-xs font-medium text-[#0E1B3D]/70 px-1 leading-tight">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="divide-y divide-[#0E1B3D]/5">
          {activeQuestions.map((q, index) => {
            const isAttentionCheck = q.question_code.startsWith('VQ_A');
            const displayText = isAttentionCheck
              ? q.question_text.replace('[ATTENTION CHECK] ', '')
              : q.question_text;
            
            const currentAnswer = answers[q.id];
            const isSaving = savingQuestions[q.id];
            
            // Generate inline tailwind colors for border/bg doesn't work well due to PurgeCSS, 
            // but we can use static classes or inline styles. Let's use dynamic class mapping based on color hex if possible, 
            // or just use #B89862 as a fallback highlight for selection.
            // Since we know the colors:
            let selectedBorderClass = "border-[#B89862]";
            let selectedBgClass = "bg-[#B89862]/10";
            let selectedTextBgClass = "bg-[#B89862]";
            
            if (activeTab === 'riasec') { selectedBorderClass = "border-[#0E1B3D]"; selectedBgClass = "bg-[#0E1B3D]/5"; selectedTextBgClass = "bg-[#0E1B3D]"; }
            else if (activeTab === 'big_five') { selectedBorderClass = "border-[#1a3a6b]"; selectedBgClass = "bg-[#1a3a6b]/5"; selectedTextBgClass = "bg-[#1a3a6b]"; }
            else if (activeTab === 'career_readiness') { selectedBorderClass = "border-[#2d6a4f]"; selectedBgClass = "bg-[#2d6a4f]/5"; selectedTextBgClass = "bg-[#2d6a4f]"; }
            else if (activeTab === 'validity') { selectedBorderClass = "border-[#555555]"; selectedBgClass = "bg-[#555555]/5"; selectedTextBgClass = "bg-[#555555]"; }

            return (
              <div key={q.id} className="p-4 sm:p-8 md:p-12 hover:bg-[#0E1B3D]/[0.01] transition-colors">
                <div className="flex gap-4 mb-6">
                  <span className="text-lg font-serif font-bold text-[#B89862] shrink-0">
                    {index + 1}.
                  </span>
                  <p className="text-lg md:text-xl font-medium text-[#0E1B3D] leading-relaxed">
                    {displayText}
                  </p>
                </div>
                
                {/* Horizontal Options */}
                <div className="pl-0 md:pl-10">
                  <div className="grid grid-cols-5 gap-1 sm:gap-2 md:gap-4 max-w-3xl">
                    {labels.map(option => {
                      const isSelected = currentAnswer === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleSelect(q.id, option.value)}
                          disabled={isSaving}
                          aria-label={`Câu ${q.question_code}, đáp án ${option.value}`}
                          className={`relative flex flex-col items-center p-2 sm:p-3 md:p-4 rounded-xl border-2 transition-all duration-200 group active:scale-90 ${
                            isSelected
                              ? `${selectedBorderClass} ${selectedBgClass}`
                              : "border-[#0E1B3D]/10 hover:border-[#B89862]/40 hover:bg-[#B89862]/5"
                          } ${isSaving ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base md:text-lg transition-colors shrink-0 ${
                            isSelected
                              ? `${selectedTextBgClass} text-white shadow-md`
                              : "bg-[#0E1B3D]/5 text-[#0E1B3D]/60 group-hover:bg-[#B89862]/20 group-hover:text-[#B89862]"
                          }`}>
                            {isSaving && isSelected ? (
                              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            ) : (
                              option.value
                            )}
                          </div>
                          {/* Desktop label below number */}
                          <span className={`hidden md:block mt-3 text-xs text-center font-medium transition-colors ${
                            isSelected ? "text-[#0E1B3D]" : "text-[#0E1B3D]/40 group-hover:text-[#0E1B3D]/70"
                          }`}>
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation & Submit */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-12">
        <div className="text-sm font-bold text-[#0E1B3D]/40">
          * Đừng quên kiểm tra các nhóm khác trên thanh Tabs
        </div>
        
        {totalAnswered === questions.length ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-[#0E1B3D] text-white font-bold text-lg hover:bg-[#B89862] transition-all shadow-lg hover:shadow-xl"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>
            ) : (
              <>Hoàn tất & Xem kết quả <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        ) : (
          <button
            onClick={() => {
              // Find next incomplete tab
              const nextTabIdx = MODULE_ORDER.findIndex(m => m === activeTab) + 1;
              if (nextTabIdx < MODULE_ORDER.length) {
                setActiveTab(MODULE_ORDER[nextTabIdx]);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            disabled={activeTab === MODULE_ORDER[MODULE_ORDER.length - 1]}
            className="w-full sm:w-auto px-8 py-4 rounded-full border border-[#0E1B3D]/20 text-[#0E1B3D] font-bold hover:border-[#0E1B3D]/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Qua nhóm tiếp theo
          </button>
        )}
      </div>
    </div>
  );
}
