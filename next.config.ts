import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const repoName = "prismora";
const basePath = isGithubActions ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  reactCompiler: false,
  output: 'export', 
  basePath: basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;