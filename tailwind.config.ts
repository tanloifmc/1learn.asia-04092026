import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "var(--navy)",
        gold: "var(--gold)",
        background: "var(--background)",
        surface: "var(--surface)",
        "soft-blue": "var(--soft-blue)",
        "soft-beige": "var(--soft-beige)",
        
        primary: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-dark)",
          soft: "var(--primary-soft)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          soft: "var(--secondary-soft)",
        },
        sage: {
          DEFAULT: "var(--sage)",
          soft: "var(--sage-soft)",
        },
        amber: {
          DEFAULT: "var(--amber)",
          soft: "var(--amber-soft)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        info: "var(--info)",
        border: "var(--border)",
        
        text: {
          primary: "var(--navy)",
          secondary: "rgba(14, 27, 61, 0.7)", 
          muted: "rgba(14, 27, 61, 0.4)",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        heading: ["var(--font-serif)"],
      },
    },
  },
  plugins: [],
};
export default config;
