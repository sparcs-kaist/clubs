import createNextIntlPlugin from "next-intl/plugin";

import { CLUBS_VERSION } from "./src/constants/appVersion.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",
  headers: async () => {
    return [
      {
        // Apply these headers to all routes in your application.
        source: "/(.*)",
        headers: [
          {
            key: "x-nextjs-version",
            value: "15.5.18",
          },
          {
            key: "x-clubs-version",
            value: CLUBS_VERSION,
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
