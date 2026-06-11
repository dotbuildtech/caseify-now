/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**' }
        ]
    },
    async rewrites() {
        return [
            { source: '/api/:path*', destination: 'http://localhost:5001/api/:path*' },
            { source: '/uploads/:path*', destination: 'http://localhost:5001/uploads/:path*' }
        ];
    },
    async headers() {
        return [
            { source: '/(.*)', headers: [{ key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' }] }
        ];
    },
    webpack: (config) => {
        config.optimization.concatenateModules = false;
        return config;
    }
};

export default nextConfig;
