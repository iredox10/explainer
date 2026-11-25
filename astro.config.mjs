// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
    site: 'https://explainer.africa',
    output: 'server',
    adapter: netlify({
        imageCDN: process.env.NETLIFY === 'true',
        devFeatures: {
            images: false,
        },
    }),
    integrations: [react(), tailwind(), sitemap()],
    image: {
        domains: ['cloud.appwrite.io', 'api.dicebear.com', 'images.unsplash.com', 'localhost', '127.0.0.1'],
    },
    vite: {
        // Keep builds from replacing dependencies used by a running dev server.
        cacheDir: `node_modules/.vite/${process.env.NODE_ENV ?? 'development'}`,
    },
});
