import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  compiler: {
    styledComponents: true,
  },
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'http://localhost:8085/auth/:path*',
      },
      {
        source: '/graphql',
        destination: 'http://localhost:8085/graphql',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8085/api/:path*',
      },
    ];
  },
};

export default nextConfig;
