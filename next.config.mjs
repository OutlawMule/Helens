/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Lint is not part of the build; run your own ESLint setup if you want it.
  eslint: { ignoreDuringBuilds: true },
  // Type errors fail the build by default. Set SKIP_TYPECHECK=1 only as a temporary escape hatch.
  typescript: { ignoreBuildErrors: process.env.SKIP_TYPECHECK === '1' },
  images: {
    // Gallery photos uploaded in the admin panel live in Supabase Storage (public bucket "gallery").
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' }],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
