/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@treasure-hunt/shared'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'leaflet': 'leaflet/dist/leaflet.js'
    };
    return config;
  },
}

module.exports = nextConfig
