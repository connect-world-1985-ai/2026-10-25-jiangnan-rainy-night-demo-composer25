import { defineConfig } from 'vite';

const repoName = '2026-10-25-jiangnan-rainy-night-demo-composer25';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? `/${repoName}/` : '/',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
  },
});
