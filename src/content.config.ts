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
    leftVideoUrl: z.string().optional(),
    rightVideoUrl: z.string().optional(),
    ambientAudioUrl: z.string().optional(),

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
          layout: z.enum(['standard', 'full-width']).optional(),
          displayMode: z.enum(['slider', 'split']).default('slider')
        }),
        z.object({
          type: z.literal('timeline'),
          label: z.string().optional(),
          highlight: z.string().optional(),
          timelineSteps: z.array(z.object({ year: z.string(), label: z.string() })).optional(),
          style: z.enum(['track', 'stacked', 'cards']).optional(),
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
          caption: z.string().optional(),
          center: z.array(z.number()).optional(),
          zoom: z.number().optional(),
          viewBox: z.string().optional(),
          highlight: z.union([z.string(), z.array(z.string()), z.record(z.string())]).optional(),
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
              type: z.enum(['map', 'chart', 'text', 'tactical', 'timeline', 'media']),
              text: z.string(),
              label: z.string().optional(),
              url: z.string().optional(), // For MediaVisual
              center: z.array(z.number()).optional(), // For TacticalVisual
              viewBox: z.string().optional(),
              highlight: z.union([z.string(), z.array(z.string()), z.record(z.string())]).optional(),
              timelineSteps: z.array(z.object({ year: z.string(), label: z.string() })).optional(),
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
        highlight: z.union([z.string(), z.array(z.string()), z.record(z.string())]).optional(),
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
    tags: z.array(z.string()).optional(),
    sources: z.array(z.object({
      title: z.string(),
      url: z.string().optional(),
      publisher: z.string().optional(),
      date: z.string().optional()
    })).optional(),
    footnotes: z.array(z.object({
      id: z.string(),
      text: z.string(),
      url: z.string().optional()
    })).optional(),
    scheduledAt: z.string().optional(),
    seo: z.object({
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      ogImage: z.string().optional(),
      canonicalUrl: z.string().optional(),
      keywords: z.array(z.string()).optional()
    }).optional(),
    revisionSnapshots: z.array(z.object({
      id: z.string(),
      createdAt: z.string(),
      user: z.string().optional(),
      story: z.record(z.any())
    })).optional(),
  }),
});

export const collections = { stories };
