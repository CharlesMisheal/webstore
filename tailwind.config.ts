import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0E1B33",
          2: "#14254A",
          dark: "#0A0F1A", // ink
        },
        ink: "#0A0F1A",
        gold: {
          DEFAULT: "#B8923A",
          light: "#D4AF5A",
          dark: "#8A6A1F",
        },
        ivory: {
          DEFAULT: "#FAF7F0",
          2: "#F2EDE2",
        },
        stone: {
          DEFAULT: "#E9E7E3",
          border: "#B7B2A5",
        },
        beige: "#C9B79C",
        brown: "#4A3426",
        aplus: {
          success: "#2F7D5B",
          error: "#B3402F",
          warning: "#9A6A12",
          info: "#243E75",
        },
        text: {
          DEFAULT: "#1B2230",
          2: "#4B5565",
          3: "#6B7280",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        heading: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
        md: "4px",
        lg: "6px",
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(14, 27, 51, 0.08)",
        card: "0 4px 12px rgba(14, 27, 51, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
