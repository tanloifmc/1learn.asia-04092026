import Link from "next/link";

export default function PricingPage() {
  return <main className="stack"><p className="eyebrow">Thanh vien</p><h1>Goi thanh vien</h1><p>Phuong thuc kich hoat duoc cau hinh theo tung ung dung su dung core nay.</p><Link className="button button--primary" href="/membership">Xem cac goi</Link></main>;
}
