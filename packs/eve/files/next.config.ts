import { withEve } from "eve/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
};

export default withEve(nextConfig);
