/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'http://127.0.0.1:8080/api/admin/:path*',
      },
      {
        source: '/api/edge/:path*',
        destination: 'http://127.0.0.1:8080/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
