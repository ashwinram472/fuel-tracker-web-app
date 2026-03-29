import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxies /api/socket to the Traccar server for WebSocket connections
  async rewrites() {
    const traccarUrl = process.env.TRACCAR_API_URL || 'https://app.flytr.in';
    return [
      {
        source: '/api/socket',
        destination: `${traccarUrl}/api/socket`,
      },
    ];
  },
};

export default nextConfig;
