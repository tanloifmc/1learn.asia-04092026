"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Copy, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { getOrCreatePendingTransaction } from "./actions";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionCode, setTransactionCode] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const res = await getOrCreatePendingTransaction();
      if (res.success && res.transactionCode) {
        setTransactionCode(res.transactionCode);
        setAmount(res.amount || 0);
      } else {
        setError(res.error || "Không thể khởi tạo giao dịch.");
      }
      setIsInitializing(false);
    }
    init();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Đã sao chép: " + text);
  };

  const handleSubmit = async () => {
    // User claims to have paid. Just show success screen.
    // The webhook will handle the actual activation behind the scenes.
    setIsSuccess(true);
  };

  if (isInitializing) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#B89862] mx-auto mb-4" />
        <p className="text-[#0E1B3D]/70">Đang khởi tạo giao dịch...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="font-serif text-3xl text-[#0E1B3D]">Xác nhận đã chuyển khoản</h1>
        <p className="text-[#0E1B3D]/70 text-lg">
          Hệ thống đang chờ nhận thanh toán từ ngân hàng (thường mất 1-5 phút).
          Gói Premium sẽ tự động được kích hoạt khi thanh toán thành công.
        </p>
        <button onClick={() => router.push("/me/bao-cao")} className="inline-block px-8 py-4 bg-[#B89862] text-[#0E1B3D] font-bold rounded-full hover:bg-white transition-colors border border-[#B89862] mt-8">
          Quay lại Báo cáo
        </button>
      </div>
    );
  }

  const bankId = process.env.NEXT_PUBLIC_BANK_ID || "970423"; 
  const accountNo = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || "0123456789";
  const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "LE TAN LOI";
  // Sử dụng vietqr.app theo mẫu của khách hàng (hiển thị logo SePay đẹp hơn)
  const qrUrl = `https://vietqr.app/img?bank=${bankId}&acc=${accountNo}&template=compact&amount=${amount}&showinfo=false&holder=${encodeURIComponent(accountName)}&addInfo=${transactionCode}`;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <Link href="/membership" className="inline-flex items-center gap-2 text-[#0E1B3D]/50 hover:text-[#0E1B3D] mb-8 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Quay lại Gói Thành Viên
      </Link>

      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-[#0E1B3D]/5">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl text-[#0E1B3D] mb-4">Thanh toán chuyển khoản</h1>
          <p className="text-[#0E1B3D]/70 text-lg">Nâng cấp Báo cáo Premium (1 Năm)</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 flex items-start gap-3">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Bank Info */}
          <div className="space-y-6">
            <h3 className="font-bold text-[#0E1B3D] text-xl border-b pb-4">Thông tin người nhận</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#0E1B3D]/50 mb-1">Ngân hàng</p>
                <p className="font-bold text-[#0E1B3D] uppercase">
                  {bankId === "970436" ? "Vietcombank (VCB)" : `Ngân hàng ID: ${bankId}`}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-[#0E1B3D]/50 mb-1">Số tài khoản</p>
                <div className="flex items-center justify-between bg-[#F7F5F0] p-3 rounded-xl border border-[#0E1B3D]/10">
                  <span className="font-bold text-[#0E1B3D] tracking-wider">{accountNo}</span>
                  <button onClick={() => handleCopy(accountNo)} className="text-[#B89862] hover:text-[#0E1B3D] transition-colors p-2">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-[#0E1B3D]/50 mb-1">Tên chủ tài khoản</p>
                <p className="font-bold text-[#0E1B3D] uppercase">{accountName}</p>
              </div>
              
              <div>
                <p className="text-sm text-[#0E1B3D]/50 mb-1">Số tiền</p>
                <div className="flex items-center justify-between bg-[#F7F5F0] p-3 rounded-xl border border-[#0E1B3D]/10">
                  <span className="font-bold text-[#0E1B3D] text-lg text-[#B89862]">{amount.toLocaleString("vi-VN")} VNĐ</span>
                  <button onClick={() => handleCopy(amount.toString())} className="text-[#B89862] hover:text-[#0E1B3D] transition-colors p-2">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm text-[#0E1B3D]/50 mb-1">Nội dung chuyển khoản (Bắt buộc)</p>
                <div className="flex items-center justify-between bg-yellow-50 p-3 rounded-xl border border-yellow-200">
                  <span className="font-bold text-yellow-800 tracking-wider text-lg">{transactionCode}</span>
                  <button onClick={() => handleCopy(transactionCode)} className="text-yellow-700 hover:text-yellow-900 transition-colors p-2">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-[#0E1B3D]/50 mt-2 flex gap-1 items-start">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" />
                  Vui lòng ghi đúng nội dung để hệ thống duyệt tự động.
                </p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center bg-[#F7F5F0] p-8 rounded-3xl border border-[#0E1B3D]/5 h-full">
            <p className="font-bold text-[#0E1B3D] mb-6">Quét mã QR để thanh toán nhanh</p>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <img src={qrUrl} alt="QR Code Thanh Toán" className="w-64 h-auto" />
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col items-center space-y-4">
          <p className="text-[#0E1B3D]/60 text-sm">Sau khi chuyển khoản thành công, vui lòng nhấn nút bên dưới.</p>
          <button 
            onClick={handleSubmit} 
            className="flex items-center justify-center gap-2 w-full md:w-auto px-12 py-4 bg-[#B89862] text-[#0E1B3D] font-bold rounded-full hover:bg-white border hover:border-[#B89862] transition-colors text-lg shadow-lg"
          >
            Tôi đã chuyển khoản
          </button>
        </div>
      </div>
    </div>
  );
}
