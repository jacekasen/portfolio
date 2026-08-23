import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [],
      // The flight tracker is a static Expo export served from /public. It routes
      // on the client, so a deep link like /flight-tracker/insights has no file
      // behind it and needs to fall back to the app shell.
      //
      // Asset paths are excluded on purpose: without that, a missing bundle would
      // be answered with index.html instead of a 404, and the browser would try to
      // parse HTML as JavaScript.
      afterFiles: [
        { source: '/flight-tracker', destination: '/flight-tracker/index.html' },
        {
          source: '/flight-tracker/:path((?!_expo|assets).*)',
          destination: '/flight-tracker/index.html',
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
