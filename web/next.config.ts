import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false, // Temporarily disable to test AuthContext issue
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configure output file tracing to use web directory as root for standalone deployment
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  // Disable prerendering during export for App Hosting compatibility
  trailingSlash: false,
  generateEtags: false,
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
    // Allow local images from public directory and common image paths
    localPatterns: [
      {
        pathname: '/imgs/**',
      },
      {
        pathname: '/images/**',
      },
      {
        pathname: '/logos/**',
      },
      {
        pathname: '/assets/**',
      },
      {
        pathname: '/*.{png,jpg,jpeg,gif,webp,avif,svg}',
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
          destination: 'http://localhost:5001/ee-prod-apps/europe-west1/:path*',
        },
      ]
    }

    // In production, API calls should go directly to Firebase Functions
    return []
    */
  },
}

export default nextConfig
