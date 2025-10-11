/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enable static export for Azure Static Web Apps
  images: {
    unoptimized: true,  // Required for static export
    domains: ['images.unsplash.com', 'placehold.co'],
  },
}

module.exports = nextConfig
