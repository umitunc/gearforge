import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Göreceli yol (GitHub Pages, Vercel, Netlify ve statik sunucular için uyumlu)
  build: {
    target: 'esnext',
    assetsInlineLimit: 4096,
  },
});
