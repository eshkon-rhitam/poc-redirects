import type { NextConfig } from "next";
import { redirects } from "./redirects";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return redirects;
  },
};

export default nextConfig;
