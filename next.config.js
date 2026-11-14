/** @type {import('next').NextConfig} */
// Next.js 14 only loads instrumentation.js when this flag is on.
// (Next.js 15+ loads it automatically, so this flag can be removed on upgrade.)
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
