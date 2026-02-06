import rss from '@astrojs/rss';
import { serverStoryService } from '../lib/server-appwrite';

export async function GET(context) {
  const stories = await serverStoryService.getPublishedStories();
  
  return rss({
    title: 'Explainer',
    description: 'In-depth investigative journalism and visual storytelling.',
    site: context.site,
    items: stories.map((story) => ({
      title: story.headline,
      pubDate: new Date(story.publishedAt || story.$createdAt),
      description: story.subhead,
      link: `/article/${story.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
