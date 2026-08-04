import Link from "next/link";

export default function PricingPage() {
  return <main className="stack"><p className="eyebrow">Thanh vien</p><h1>Goi thanh vien</h1><p>Cac goi duoc kich hoat sau khi SePay xac nhan chuyen khoan.</p><Link className="button button--primary" href="/membership">Xem va chon goi</Link></main>;
}
