/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    // Only apply strict privacy headers if PRIVATE_MODE is enabled
    const isPrivateMode = process.env.PRIVATE_MODE === 'true';
    
    if (!isPrivateMode) {
      return []; // No special headers in public mode
    }

    return [
      {
        source: '/:path*',
        headers: [
          // Prevent search engine indexing
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet',
          },
          // Prevent embedding in iframes (clickjacking protection)
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer policy - don't leak URLs
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
          // Content Security Policy - strict
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
