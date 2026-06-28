/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  // The home page reads /public/home-heroes at request time to pick a random
  // hero. public/ files are served by the CDN but are NOT in the serverless
  // function bundle by default, so include them so fs.readdirSync works in prod.
  experimental: {
    outputFileTracingIncludes: {
      "/home": ["./public/home-heroes/**/*"],
    },
  },
};

export default nextConfig;
