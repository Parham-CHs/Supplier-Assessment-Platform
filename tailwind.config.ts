import type { Config } from "tailwindcss";
const config: Config = { content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: { colors: { ink: "#172033", muted: "#667085", line: "#e7eaf0", brand: { DEFAULT: "#4f46e5", soft: "#eef2ff" } }, boxShadow: { soft: "0 8px 30px rgba(16,24,40,.06)" } } }, plugins: [] };
export default config;
