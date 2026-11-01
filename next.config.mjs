/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { cpus: 2 },
  outputFileTracingExcludes: {
    '/*': ['./original-sites-source.zip', './docs/**/*', './tests/**/*', './.data/**/*'],
  },
};
export default config;
