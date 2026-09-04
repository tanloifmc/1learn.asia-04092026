"use client";

import { useState } from "react";
import { bootstrapSuperAdminAction } from "@/features/admin/actions/bootstrap";

export default function BootstrapPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleBootstrap = async () => {
    setLoading(true);
    setMessage("");
    
    const result = await bootstrapSuperAdminAction();
    setMessage(result.success ? "✅ " + result.message : "❌ Lỗi: " + result.error);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-slate-900">
      <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Khởi tạo Super Admin</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Nhấn nút bên dưới để cấp quyền `super_admin` cho tài khoản đang đăng nhập. 
          Lưu ý: Nút này chỉ hoạt động nếu trong hệ thống CHƯA có bất kỳ Super Admin nào.
        </p>
        <button 
          onClick={handleBootstrap}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Nhận quyền Super Admin"}
        </button>
        {message && (
          <div className="mt-4 p-3 rounded bg-slate-100 text-sm font-mono">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
