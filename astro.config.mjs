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
  adapter: netlify(),
  integrations: [react(), tailwind(), sitemap()],
  image: {
    domains: ['cloud.appwrite.io', 'api.dicebear.com', 'images.unsplash.com'],
  },
});
