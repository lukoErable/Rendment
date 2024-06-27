/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'app.mango.markets',
        port: '',
        pathname: '/icons/**',
      },
      {
        protocol: 'https',
        hostname: 'www.lulo.fi',
        port: '',
        pathname: '/protocols/**',
      },
      {
        protocol: 'https',
        hostname: 'www.meteora.ag',
        port: '',
        pathname: '/logo.svg',
      },
      {
        protocol: 'https',
        hostname: 'app.sanctum.so',
        port: '',
        pathname: '/favicon.ico',
      },
    ],
  },
};

export default nextConfig;
