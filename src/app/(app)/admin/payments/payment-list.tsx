"use client";

import { useState } from "react";
import { approvePayment, rejectPayment } from "./actions";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";

export function PaymentList({ initialTransactions }: { initialTransactions: any[] }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    if (!confirm("Xác nhận đã nhận tiền và kích hoạt Premium?")) return;
    setLoading(id);
    try {
      await approvePayment(id);
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, status: "completed" } : tx))
      );
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setLoading(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm("Từ chối giao dịch này?")) return;
    setLoading(id);
    try {
      await rejectPayment(id);
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, status: "rejected" } : tx))
      );
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setLoading(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-4 font-medium">Thời gian</th>
              <th className="p-4 font-medium">User ID (Nội dung CK)</th>
              <th className="p-4 font-medium">Số tiền</th>
              <th className="p-4 font-medium">Trạng thái</th>
              <th className="p-4 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Không có giao dịch nào
                </td>
              </tr>
            )}
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50/50">
                <td className="p-4 text-gray-600">
                  {new Date(tx.created_at).toLocaleString("vi-VN")}
                </td>
                <td className="p-4">
                  <div className="font-bold text-gray-900">{tx.transaction_code || "N/A"}</div>
                  <div className="font-mono text-xs text-gray-500 mt-1" title={tx.user_id}>User ID: {tx.user_id.slice(0,8)}...</div>
                </td>
                <td className="p-4 font-medium text-gray-900">
                  {Number(tx.amount).toLocaleString("vi-VN")}đ
                </td>
                <td className="p-4">
                  {tx.status === "pending" && (
                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-3.5 h-3.5" /> Chờ duyệt
                    </span>
                  )}
                  {tx.status === "completed" && (
                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3.5 h-3.5" /> Hoàn thành
                    </span>
                  )}
                  {tx.status === "rejected" && (
                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="w-3.5 h-3.5" /> Từ chối
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {tx.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(tx.id)}
                        disabled={loading === tx.id}
                        className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {loading === tx.id && <Loader2 className="w-3 h-3 animate-spin" />}
                        Duyệt
                      </button>
                      <button
                        onClick={() => handleReject(tx.id)}
                        disabled={loading === tx.id}
                        className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md font-medium transition-colors disabled:opacity-50"
                      >
                        Từ chối
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
