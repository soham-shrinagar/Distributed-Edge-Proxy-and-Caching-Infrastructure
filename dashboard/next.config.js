const proxyUrl = process.env.EDGE_PROXY_URL || 'http://127.0.0.1:8080';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${proxyUrl}/api/admin/:path*`,
      },
      {
        source: '/api/edge/:path*',
        destination: `${proxyUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
