import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SEPAY_SECRET = process.env.SEPAY_WEBHOOK_SECRET;

if (!SEPAY_SECRET) {
  console.error("❌ Không tìm thấy SEPAY_WEBHOOK_SECRET trong .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTest() {
  console.log("🔍 Đang tìm một giao dịch đang chờ duyệt (pending)...");
  
  let { data: tx, error } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !tx) {
    console.log("⚠️ Không có giao dịch pending nào. Sẽ tự động tạo một cái ảo để test...");
    
    // Lấy đại 1 user
    const { data: user } = await supabase.from("profiles").select("id").limit(1).single();
    const { data: plan } = await supabase.from("membership_plans").select("id, price_amount").limit(1).single();
    
    if (!user || !plan) {
      console.error("❌ Database trống, không có User hoặc Plan nào.");
      process.exit(1);
    }
    
    const transactionCode = `1L-TEST${Math.floor(Math.random() * 1000)}`;
    const { data: newTx, error: insertErr } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: user.id,
        amount: plan.price_amount,
        plan_id: plan.id,
        status: "pending",
        method: "bank_transfer",
        transaction_code: transactionCode
      })
      .select("*")
      .single();
      
    if (insertErr || !newTx) {
      console.error("❌ Không thể tạo giao dịch ảo:", insertErr);
      process.exit(1);
    }
    tx = newTx;
  }

  console.log(`✅ Tìm thấy giao dịch: ${tx.transaction_code} (User: ${tx.user_id}, Số tiền: ${tx.amount} VNĐ)`);
  console.log("🚀 Bắt đầu giả lập Webhook từ SePay bắn về localhost:3000...");

  const payload = {
    id: Math.floor(Math.random() * 100000), // ID giao dịch ảo của ngân hàng
    gateway: "TPBank",
    transactionDate: new Date().toISOString(),
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || "00003554020",
    subAccount: null,
    code: null,
    content: `Thanh toan don hang ${tx.transaction_code}`, // Chứa mã giao dịch
    transferType: "in",
    transferAmount: tx.amount, // Gửi đúng số tiền
    accumulated: 1000000,
    channel: "App",
    referenceCode: `FT${Math.floor(Math.random() * 1000000)}`
  };

  const rawBody = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // Tính chữ ký HMAC-SHA256
  const hmac = crypto.createHmac("sha256", SEPAY_SECRET!);
  hmac.update(`${timestamp}.${rawBody}`);
  const signature = `sha256=${hmac.digest("hex")}`;

  try {
    const response = await fetch("http://localhost:3000/hooks/sepay-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SePay-Signature": signature,
        "X-SePay-Timestamp": timestamp
      },
      body: rawBody
    });

    const result = await response.json();
    console.log("📥 Phản hồi từ Webhook server:");
    console.log(result);

    if (response.ok && result.success) {
      console.log(`🎉 TEST THÀNH CÔNG! Giao dịch ${tx.transaction_code} đã được xử lý.`);
      
      // Kiểm tra lại db xem đã thành completed chưa
      const { data: updatedTx } = await supabase
        .from("payment_transactions")
        .select("status")
        .eq("id", tx.id)
        .single();
        
      console.log(`Trạng thái hiện tại trong DB: ${updatedTx?.status}`);
    } else {
      console.error("❌ TEST THẤT BẠI. Webhook server từ chối.");
    }
  } catch (err: any) {
    console.error("❌ Không kết nối được tới localhost:3000. Bạn đã chạy 'npm run dev' chưa?");
  }
}

runTest();
