/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // In production, proxy /api/* to the real backend (same-origin → cookies work)
    const backend = process.env.BACKEND_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/:path*`,
      },
    ];
  },
};

export default nextConfig;
