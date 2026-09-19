/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/",
        missing: [
          {
            type: "query",
            key: "report",
          },
        ],
        destination: "/screener",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
