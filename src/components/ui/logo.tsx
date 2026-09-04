interface LogoProps {
  className?: string;
  isTransparent?: boolean;
}

export function Logo({ className = "", isTransparent }: LogoProps) {
  return (
    <span className={`font-serif font-bold tracking-tight leading-none transition-colors ${
      isTransparent ? "text-white" : "text-[#0E1B3D]"
    } ${className}`}>
      <span className="text-[#B89862]">1</span>learn
    </span>
  );
}
