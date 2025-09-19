import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false, // Temporarily disable to test AuthContext issue
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Temporarily disable package optimizations that might be causing Firebase issues
  // experimental: {
  //   optimizePackageImports: ['react-icons'],
  // },
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
    // Temporarily disable Firebase Functions proxy since we're using Next.js API routes
    return []

    /* DISABLED - We're now using Next.js API routes instead of Firebase Functions
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
    */
  },
}

export default nextConfig
