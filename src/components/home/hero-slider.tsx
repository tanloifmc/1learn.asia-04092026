"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

const slides = [
  {
    eyebrow: "01 / HIỂU MÌNH",
    title: "Hiểu mình",
    subtitle: "Khám phá sở thích, năng lực, đặc điểm cá nhân và những điều thực sự quan trọng với bạn.",
    supporting: "Trước khi chọn một ngành học, hãy bắt đầu bằng việc hiểu chính mình.",
    cta: "Bắt đầu khám phá",
    secondaryCta: "Tìm hiểu cách hoạt động",
    image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2940&auto=format&fit=crop", // Vietnamese female student in library
  },
  {
    eyebrow: "02 / CHỌN ĐÚNG HƯỚNG",
    title: "Chọn đúng hướng",
    subtitle: "Từ hồ sơ của bạn, khám phá những nghề nghiệp, ngành học và trường đại học đáng để tìm hiểu.",
    supporting: "Không phải chọn một đáp án duy nhất. Hãy mở rộng những lựa chọn phù hợp với bạn.",
    cta: "Khám phá nghề nghiệp",
    secondaryCta: "Xem ngành học",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2942&auto=format&fit=crop", // Male student in campus
  },
  {
    eyebrow: "03 / CHỦ ĐỘNG TƯƠNG LAI",
    title: "Chủ động tương lai",
    subtitle: "Biết mình đang ở đâu, muốn đi đâu và cần chuẩn bị gì để tiến gần mục tiêu.",
    supporting: "1learn không chọn tương lai thay bạn. 1learn giúp bạn biết bước tiếp theo nên là gì.",
    cta: "Lập lộ trình",
    secondaryCta: "Dành cho phụ huynh",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2940&auto=format&fit=crop", // Group of students
  }
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#0E1B3D] overflow-hidden flex flex-col justify-center">
      
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          <div className={`absolute inset-0 w-full h-full transition-transform duration-[10000ms] ease-out ${index === currentSlide ? "scale-105" : "scale-100"}`}>
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
          </div>
          
          {/* Dark Overlay Gradient (Navy fading to transparent) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E1B3D]/95 via-[#0E1B3D]/70 to-transparent"></div>
          {/* Subtle noise/texture overlay if desired */}
          <div className="absolute inset-0 bg-navy/20 mix-blend-overlay"></div>

          {/* Text Content */}
          <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 lg:px-24 max-w-4xl pt-20">
            <div className={`transition-all duration-1000 delay-100 transform ${index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
              <div className="flex items-center gap-2 text-[#C6A15B] font-bold tracking-[0.2em] text-xs mb-8 uppercase">
                <Sparkles className="w-4 h-4" />
                <span>{slide.eyebrow}</span>
              </div>
              
              <h1 className="font-serif text-5xl md:text-7xl lg:text-[88px] font-medium text-white leading-[1.05] mb-8 tracking-tight">
                {slide.title}
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 font-light leading-relaxed mb-8 max-w-2xl">
                {slide.subtitle}
              </p>
              
              <p className="text-base md:text-lg text-white/60 font-medium leading-relaxed mb-12 max-w-lg pl-5 border-l-2 border-[#C6A15B]/50 italic">
                {slide.supporting}
              </p>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                <Link href="/login" className="bg-[#C6A15B] text-white px-8 py-4 rounded-full shadow-lg font-bold tracking-wide flex items-center gap-2 group hover:bg-[#B38F4D] transition-colors">
                  {slide.cta} <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/login" className="text-white/70 hover:text-white font-semibold text-base transition-colors border-b border-transparent hover:border-white/50 pb-1 flex items-center gap-2">
                  {slide.secondaryCta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Progress Indicators */}
      <div className="absolute bottom-12 left-6 lg:left-16 xl:left-24 z-30 flex items-center gap-6">
        {slides.map((_, index) => (
          <div key={index} className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentSlide(index)}>
            <span className={`text-xs font-bold tracking-widest transition-colors ${index === currentSlide ? "text-white" : "text-white/40 group-hover:text-white/60"}`}>
              0{index + 1}
            </span>
            <div className="w-16 h-1 bg-white/20 relative overflow-hidden rounded-full">
              {index === currentSlide && (
                <div 
                  className="absolute top-0 left-0 h-full bg-[#C6A15B] transition-all duration-[6000ms] ease-linear"
                  style={{ width: "100%", animation: "progress 6s linear forwards" }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}} />
    </div>
  );
}
