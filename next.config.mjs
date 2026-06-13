/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable client-side router cache for dynamic routes so admin pages
    // always show fresh data on navigation (not just on full browser refresh)
    staleTimes: { dynamic: 0 },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all public pages (not admin/api)
        source: "/((?!admin|api|_next).*)",
        headers: [
          { key: "X-Frame-Options",        value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
