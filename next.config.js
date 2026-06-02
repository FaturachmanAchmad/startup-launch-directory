/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // ── added ──
      { protocol: "https", hostname: "miro.medium.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "cdn.prod.website-files.com" },
      { protocol: "https", hostname: "imgur.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 604800,
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;