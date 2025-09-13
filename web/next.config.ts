import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false, // Temporarily disable to test AuthContext issue
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['react-icons'],
  },
  transpilePackages: ['@uiw/react-md-editor', '@uiw/react-markdown-preview'],
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    // Only use local rewrites in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5001/elektro-ekspert-apps/europe-west1/:path*',
        },
      ]
    }

    // In production, API calls should go directly to Firebase Functions
    return []
  },
}

export default nextConfig
