import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: true,
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
            value: "14.2.35"
          }
        ],
      },
    ];
  }
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
