/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'res.cloudinary.com' },
            { protocol: 'https', hostname: 'images.unsplash.com' }
        ]
    },
    async rewrites() {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        return [
            { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
            { source: '/uploads/:path*', destination: `${backendUrl}/uploads/:path*` }
        ];
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
                ]
            }
        ];
    },
    webpack: (config) => {
        config.optimization.concatenateModules = false;
        return config;
    },
    // Prevent server-side source map exposure in production
    productionBrowserSourceMaps: false
};

export default nextConfig;
