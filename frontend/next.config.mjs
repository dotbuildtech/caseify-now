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
            { source: '/api/:path*', destination: 'http://localhost:5001/api/:path*' }
        ];
    }
};

export default nextConfig;
