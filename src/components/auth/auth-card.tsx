import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <main className="flex h-screen w-full bg-background overflow-hidden">
      {/* Left side: Editorial Image */}
      <div className="hidden lg:flex w-1/2 relative bg-navy items-end justify-start overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2942&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-[10000ms] hover:scale-105"></div>
        <div className="absolute inset-0 bg-navy/40 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent"></div>
        
        <div className="relative z-10 p-12 lg:p-16 w-full max-w-2xl">
           <Link href="/" className="inline-block text-white/50 hover:text-white transition-colors mb-10">
             <ArrowLeft className="w-6 h-6" />
           </Link>
           <h2 className="font-serif text-5xl lg:text-6xl text-white mb-4 leading-tight tracking-tight">
             Hiểu mình.<br/>Chọn đúng hướng.
           </h2>
           <p className="text-white/70 font-light text-lg lg:text-xl max-w-md leading-relaxed">
             Một nền tảng hướng nghiệp khoa học dành riêng cho học sinh THPT Việt Nam.
           </p>
        </div>
      </div>
      
      {/* Right side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:px-20 lg:py-8 relative overflow-y-auto">
        <Link href="/" className="lg:hidden absolute top-6 left-6 text-navy/50 hover:text-navy transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <section className="w-full max-w-md animate-fade-in" aria-labelledby="auth-title">
          <div className="mb-8">
            <h1 id="auth-title" className="font-serif text-3xl md:text-4xl text-navy mb-2 tracking-tight">{title}</h1>
            <p className="text-navy/60 font-light text-base md:text-lg">{description}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
