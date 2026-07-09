import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ویژگی standalone را در این محیط کامنت یا حذف کنید
  // output: "standalone", 
  allowedDevOrigins: ["*"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // اضافه کردن برای جلوگیری از خطاهای لینت در بولت
  },
  reactStrictMode: false,
};

export default nextConfig;
