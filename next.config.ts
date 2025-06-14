
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
      'https://6000-firebase-studio-1749853837288.cluster-uf6urqn4lned4spwk4xorq6bpo.cloudworkstations.dev',
      'https://9000-firebase-studio-1749853837288.cluster-uf6urqn4lned4spwk4xorq6bpo.cloudworkstations.dev',
    ],
  },
};

export default nextConfig;
