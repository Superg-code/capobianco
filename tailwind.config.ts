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
        brand: {
          DEFAULT: "#ffc300",
          light: "#ffd54f",
          dark: "#e6b000",
        },
        text: {
          DEFAULT: "#333333",
          muted: "#666666",
          light: "#999999",
        },
        status: {
          lead: "#94a3b8",
          prospect: "#60a5fa",
          trattativa: "#f59e0b",
          vinto: "#22c55e",
          perso: "#ef4444",
        },
      },
      fontFamily: {
        heading: ["Noto Sans", "sans-serif"],
        body: ["Open Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
