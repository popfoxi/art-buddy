import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export",
  // basePath: "/art", // 暫時移除，改回根目錄模式
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
