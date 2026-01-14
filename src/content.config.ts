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
        z.object({ type: z.literal('quote'), text: z.string(), author: z.string().optional(), layout: z.enum(['standard', 'full-width']).optional() }),
        z.object({ type: z.literal('callout'), title: z.string(), text: z.string(), layout: z.enum(['standard', 'full-width']).optional() }),
        z.object({ type: z.literal('image'), url: z.string(), caption: z.string().optional(), layout: z.enum(['standard', 'full-width']).optional() }),
        z.object({ 
            type: z.literal('beforeAfter'), 
            leftImage: z.string(), 
            rightImage: z.string(), 
            leftLabel: z.string().optional(), 
            rightLabel: z.string().optional(), 
            caption: z.string().optional(),
            layout: z.enum(['standard', 'full-width']).optional()
        }),
        z.object({
            type: z.literal('video'),
            url: z.string(),
            caption: z.string().optional(),
            autoplay: z.boolean().optional()
        }),
        z.object({
            type: z.literal('map'),
            text: z.string().optional(),
            label: z.string().optional(),
            center: z.array(z.number()).optional(),
            zoom: z.number().optional(),
            viewBox: z.string().optional(),
            highlight: z.union([z.string(), z.array(z.string())]).optional(),
            markers: z.array(z.object({ lat: z.number(), lon: z.number(), label: z.string(), icon: z.string() })).optional(),
            overlayIcons: z.array(z.object({ icon: z.string(), label: z.string() })).optional(),
            annotations: z.array(z.object({ x: z.number(), y: z.number(), text: z.string() })).optional(),
            layout: z.enum(['standard', 'full-width']).optional()
        }),
        z.object({
            type: z.literal('chart'),
            text: z.string().optional(),
            label: z.string().optional(),
            chartType: z.string().optional(),
            chartData: z.array(z.number()).optional(),
            chartLabels: z.array(z.string()).optional(),
            chartColors: z.array(z.string()).optional(),
            accentColor: z.string().optional(),
            layout: z.enum(['standard', 'full-width']).optional()
        }),
        z.object({
            type: z.literal('scrolly-group'),
            steps: z.array(
              z.object({
                type: z.enum(['map', 'chart', 'text']),
                text: z.string(),
                label: z.string().optional(),
                viewBox: z.string().optional(),
                highlight: z.union([z.string(), z.array(z.string())]).optional(),
                chartData: z.array(z.number()).optional(),
                accentColor: z.string().optional(),
                markers: z.array(z.object({ lat: z.number(), lon: z.number(), label: z.string(), icon: z.string() })).optional(),
                overlayIcons: z.array(z.object({ icon: z.string(), label: z.string() })).optional(),
                annotations: z.array(z.object({ x: z.number(), y: z.number(), text: z.string() })).optional()
              })
            )
        }),
      ])
    ).optional(),
    
    // Scrolly Content
    scrollySections: z.array(
      z.object({
        type: z.enum(['map', 'chart']),
        text: z.string(),
        label: z.string(),
        viewBox: z.string().optional(),
        highlight: z.union([z.string(), z.array(z.string())]).optional(),
        chartData: z.array(z.number()).optional(),
        accentColor: z.string().optional(),
        markers: z.array(z.object({ lat: z.number(), lon: z.number(), label: z.string(), icon: z.string() })).optional(),
        overlayIcons: z.array(z.object({ icon: z.string(), label: z.string() })).optional(),
        annotations: z.array(z.object({ x: z.number(), y: z.number(), text: z.string() })).optional()
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