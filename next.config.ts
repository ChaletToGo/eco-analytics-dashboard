/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Importante para o Docker
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'elhcijnfasljabddxfys.supabase.co', // Domínio do seu Supabase
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;