import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const stories = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/stories" }),
  schema: z.object({
    layout: z.enum(['standard', 'scrolly']).default('standard'),
    headline: z.string(),
    subhead: z.string(),
    category: z.string(),
    author: z.string().optional(),
    role: z.string().optional(),
    date: z.string().optional(),
    readTime: z.string().optional(),
    heroImage: z.string().optional(),
    videoUrl: z.string().optional(),
    
    // Standard Content
    content: z.array(
      z.union([
        z.object({ type: z.literal('heading'), text: z.string() }),
        z.object({ type: z.literal('p'), text: z.string() }),
        z.object({ type: z.literal('quote'), text: z.string(), author: z.string().optional() }),
        z.object({ type: z.literal('callout'), title: z.string(), text: z.string() }),
        z.object({ type: z.literal('image'), url: z.string(), caption: z.string().optional() }),
      ])
    ).optional(),
    
    // Scrolly Content
    scrollySections: z.array(
      z.object({
        type: z.enum(['map', 'chart']),
        text: z.string(),
        label: z.string(),
        viewBox: z.string().optional(),
        highlight: z.string().optional(),
        chartData: z.array(z.number()).optional(),
        accentColor: z.string().optional()
      })
    ).optional(),

    related: z.array(
      z.object({
        title: z.string(),
        image: z.string(),
        slug: z.string().optional()
      })
    ).optional(),
  }),
});

export const collections = { stories };