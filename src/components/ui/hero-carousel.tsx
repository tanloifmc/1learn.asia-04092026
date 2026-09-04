"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeroCarouselProps {
  images: string[];
  themeAccent?: string;
}

export function HeroCarousel({ images, themeAccent = "#B89862" }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fallback beautiful images if none provided
  const displayImages = images.length > 0 ? images : [
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop", // Campus
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop", // Students
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop"  // Library/Learning
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayImages.length);
    }, 5000); // Auto rotate every 5s
    return () => clearInterval(timer);
  }, [displayImages.length]);

  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  const goToPrev = () => setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);

  return (
    <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden bg-[#0E1B3D]">
      {/* Slides */}
      {displayImages.map((src, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#F7F5F0] via-[#0E1B3D]/50 to-[#0E1B3D]/30 z-10" />
          <Image
            src={src}
            alt={`Hero slide ${idx + 1}`}
            fill
            priority={idx === 0}
            className="object-cover"
            unoptimized
          />
        </div>
      ))}

      {/* Controls */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-4 md:px-8 z-20 pointer-events-none">
        <button
          onClick={goToPrev}
          className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white transition-all pointer-events-auto"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={goToNext}
          className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white transition-all pointer-events-auto"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-[20%] md:bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {displayImages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full ${
              idx === currentIndex
                ? "w-8 h-2 bg-white"
                : "w-2 h-2 bg-white/40 hover:bg-white/60"
            }`}
            style={idx === currentIndex ? { backgroundColor: themeAccent } : undefined}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
