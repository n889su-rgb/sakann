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
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#2d6a4f",
          800: "#1b4332",
          900: "#081c15",
        },
      },
      fontFamily: {
        sans: ["'IBM Plex Sans Arabic'", "Tajawal", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
