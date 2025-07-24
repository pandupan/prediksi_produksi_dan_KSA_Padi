/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https', 
        hostname: 'freeimghost.net',
        port: '',
        pathname: '/**', 
      },
    ],
  },
};

export default nextConfig;