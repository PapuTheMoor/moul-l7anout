import type { NextConfig } from "next";

const config: NextConfig = {
  env: {
    NEXT_PUBLIC_DEMO_ONLY: process.env.VERCEL === "1" && !process.env.OPENAI_API_KEY && !process.env.Agents_API_API_key ? "1" : "0",
  },
  outputFileTracingRoot: process.cwd(),
  devIndicators: false,
  turbopack: { root: process.cwd() },
};

export default config;
