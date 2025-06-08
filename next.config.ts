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
        hostname: 'i.ytimg.com',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle Genkit dependencies that are not compatible with webpack
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Ignore problematic modules that cause webpack warnings
    config.ignoreWarnings = [
      { module: /node_modules\/handlebars/ },
      { module: /node_modules\/require-in-the-middle/ },
      { message: /require\.extensions is not supported by webpack/ },
      { message: /Critical dependency: require function is used in a way/ },
    ];

    return config;
  },
};

export default nextConfig;
