/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'cdn.worldweatheronline.com',
        protocol: 'https',
        pathname: '**'
      }
    ]
  }
};

module.exports = nextConfig;
