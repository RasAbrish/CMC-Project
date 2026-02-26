import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg', '@prisma/adapter-pg', '@prisma/adapter-neon', '@neondatabase/serverless']
};

export default nextConfig;
