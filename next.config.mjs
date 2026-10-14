/** @type {import('next').NextConfig} */
const nextConfig = {
    // npm run build first runs lint:gate: all new errors and all hook errors block builds.
    // The complete legacy report remains available through npm run lint.
    eslint: {
        ignoreDuringBuilds: true,
    },
    webpack: (config) => {
        // Tells webpack to ignore the 'canvas' dependency
        // This fixes the "Module not found: Can't resolve 'canvas'" error
        config.resolve.alias.canvas = false;
        
        return config;
    },
};

export default nextConfig;