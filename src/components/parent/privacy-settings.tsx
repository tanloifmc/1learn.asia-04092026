"use client";

import { useState } from "react";
import { createParentInvitation, revokeParentInvitation, revokeParentLink, updateSharingPermissions } from "@/features/parent/actions";
import { ShieldCheck, UserMinus, Key, Link as LinkIcon, AlertCircle, Copy, Check } from "lucide-react";

export function PrivacySettings({ studentId, activeInvitation, parentLinks }: any) {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    setLoading(true);
    const result = await createParentInvitation(studentId);
    if (result?.rawToken) {
      setToken(result.rawToken);
    }
    setLoading(false);
  };

  const handleRevokeInvitation = async (id: string) => {
    setLoading(true);
    await revokeParentInvitation(id, studentId);
    setToken(null);
    setLoading(false);
  };

  const handleUpdatePermissions = async (linkId: string, module: string, level: number) => {
    await updateSharingPermissions(linkId, { [module]: level });
  };

  const handleRevokeLink = async (linkId: string) => {
    if (confirm("Bạn có chắc chắn muốn ngắt kết nối với phụ huynh này không?")) {
      await revokeParentLink(linkId, studentId);
    }
  };

  const copyToClipboard = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Invitation Section */}
      <div className="bg-white rounded-[32px] p-8 md:p-10 border border-[#0E1B3D]/10 shadow-[0_20px_50px_rgba(14,27,61,0.03)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#B89862]/10 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="w-12 h-12 rounded-full bg-[#0E1B3D]/5 flex items-center justify-center">
            <Key className="w-6 h-6 text-[#B89862]" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-[#0E1B3D]">Mã liên kết Phụ huynh</h3>
            <p className="text-sm text-[#0E1B3D]/60 mt-1">Tạo mã bảo mật để chia sẻ tài khoản với phụ huynh (Có hiệu lực trong 48h).</p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          {activeInvitation && !token && (
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-orange-900 font-medium">Bạn đang có một mã liên kết chưa được sử dụng.</p>
                  <p className="text-xs text-orange-700 mt-1">Tạo ngày {new Date(activeInvitation.created_at).toLocaleDateString("vi-VN")}</p>
                </div>
              </div>
              <button
                onClick={() => handleRevokeInvitation(activeInvitation.id)}
                className="text-sm font-bold text-orange-700 hover:text-orange-800 uppercase tracking-wider whitespace-nowrap"
              >
                Hủy mã cũ
              </button>
            </div>
          )}

          {token ? (
            <div className="p-8 bg-[#0E1B3D]/5 rounded-3xl border border-[#0E1B3D]/10 text-center space-y-6">
              <p className="text-sm font-bold text-[#0E1B3D]/70 uppercase tracking-wider">Mã liên kết của bạn</p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-4xl md:text-5xl font-mono tracking-[0.2em] text-[#0E1B3D] bg-white py-4 px-8 rounded-2xl shadow-sm border border-[#0E1B3D]/10">
                  {token}
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="w-14 h-14 rounded-2xl bg-[#0E1B3D] text-white flex items-center justify-center hover:bg-[#B89862] transition-colors shadow-md"
                  title="Copy"
                >
                  {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                </button>
              </div>
              <p className="text-sm text-[#0E1B3D]/60 max-w-sm mx-auto">
                Gửi mã này cho phụ huynh. Phụ huynh sẽ nhập mã này tại trang Dashboard Phụ huynh để kết nối.
              </p>
              <div>
                <button
                  onClick={() => setToken(null)}
                  className="text-sm text-[#0E1B3D]/40 font-bold hover:text-[#0E1B3D] uppercase tracking-wider"
                >
                  Ẩn mã liên kết
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerateLink}
              disabled={loading}
              className="inline-flex items-center px-8 py-4 text-base font-bold rounded-full shadow-md text-white bg-[#0E1B3D] hover:bg-[#B89862] hover:text-[#0E1B3D] focus:outline-none transition-all disabled:opacity-50 mt-4"
            >
              <LinkIcon className="w-5 h-5 mr-2" />
              {loading ? "Đang tạo mã..." : "Tạo mã liên kết mới"}
            </button>
          )}
        </div>
      </div>

      {/* Active Links Section */}
      <div className="bg-white rounded-[32px] p-8 md:p-10 border border-[#0E1B3D]/10 shadow-[0_20px_50px_rgba(14,27,61,0.03)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0E1B3D]/5 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none"></div>

        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="w-12 h-12 rounded-full bg-[#0E1B3D]/5 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#0E1B3D]" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-[#0E1B3D]">Quản lý truy cập</h3>
            <p className="text-sm text-[#0E1B3D]/60 mt-1">Danh sách các phụ huynh đang được kết nối với hồ sơ của bạn.</p>
          </div>
        </div>
        
        <div className="space-y-6 relative z-10">
          {parentLinks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-[#0E1B3D]/10 rounded-3xl">
              <p className="text-[#0E1B3D]/50 font-medium">Bạn chưa cấp quyền truy cập cho phụ huynh nào.</p>
            </div>
          ) : (
            parentLinks.map((link: any) => (
              <div key={link.id} className="border border-[#0E1B3D]/10 rounded-[24px] p-6 md:p-8 space-y-6 hover:border-[#B89862]/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#0E1B3D] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-serif text-xl">{link.parent?.full_name?.charAt(0) || "P"}</span>
                    </div>
                    <div>
                      <h4 className="font-serif text-xl text-[#0E1B3D]">{link.parent?.full_name || "Phụ huynh"}</h4>
                      <p className="text-sm text-[#0E1B3D]/60">{link.parent?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeLink(link.id)}
                    className="inline-flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 bg-red-50 px-4 py-2 rounded-full transition-colors"
                  >
                    <UserMinus className="w-4 h-4" /> Ngắt kết nối
                  </button>
                </div>
                
                <div className="space-y-4 pt-6 border-t border-[#0E1B3D]/10">
                  <h5 className="text-xs font-bold text-[#0E1B3D]/40 uppercase tracking-wider mb-2">Quyền hạn chi tiết</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Hồ sơ nghề nghiệp", key: "career_profile_level", value: link.permissions?.[0]?.career_profile_level },
                      { label: "Bài trắc nghiệm", key: "assessment_level", value: link.permissions?.[0]?.assessment_level },
                      { label: "Lộ trình mục tiêu", key: "roadmap_level", value: link.permissions?.[0]?.roadmap_level },
                      { label: "Kết quả học tập", key: "academic_level", value: link.permissions?.[0]?.academic_level },
                    ].map((perm) => (
                      <div key={perm.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#0E1B3D]/5 rounded-xl">
                        <span className="text-sm font-medium text-[#0E1B3D]">{perm.label}</span>
                        <select
                          className="text-sm bg-white border border-[#0E1B3D]/10 text-[#0E1B3D] font-medium rounded-lg px-3 py-1.5 focus:ring-[#B89862] focus:border-[#B89862] outline-none"
                          value={perm.value || 1}
                          onChange={(e) => handleUpdatePermissions(link.id, perm.key, parseInt(e.target.value))}
                        >
                          <option value={0}>Không cấp quyền</option>
                          <option value={1}>Chỉ xem tóm tắt</option>
                          <option value={2}>Xem toàn bộ chi tiết</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
