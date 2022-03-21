/** @type {import('next').NextConfig} */
module.exports = {
    reactStrictMode: true,
    swcMinify: false,
    exportPathMap: async function (
        defaultPathMap,
        { dev, dir, outDir, distDir, buildId }
    ) {
        return {
            "/": { page: "/" },
        };
    },
};
