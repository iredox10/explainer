import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DATABASE_ID;
const STORIES_COL = 'stories';

const sampleStories = [
    {
        headline: "The Hidden Cost of Urban Noise: Why Silence is the New Luxury",
        subhead: "As cities grow louder, the psychological and physical toll of sound pollution is becoming a public health crisis.",
        category: "Society",
        author: "Idris Adam",
        slug: "cost-of-urban-noise",
        status: "Published",
        isFeatured: true,
        heroImage: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=1200",
        content: JSON.stringify([
            { id: 1, type: "p", text: "In the heart of Manhattan, the sound level rarely drops below 70 decibels—the equivalent of a vacuum cleaner running constantly. While we've learned to tune it out, our bodies haven't." },
            { id: 2, type: "p", text: "Studies show that chronic exposure to urban noise increases cortisol levels, raises blood pressure, and contributes to long-term cardiovascular disease. It is the invisible pollutant of the 21st century." }
        ])
    },
    {
        headline: "Why Every Electric Vehicle is a Mobile Battery for the Power Grid",
        subhead: "Vehicle-to-grid technology is turning EVs from energy consumers into critical infrastructure for green energy storage.",
        category: "Technology",
        author: "Super Admin",
        slug: "ev-mobile-battery-grid",
        status: "Published",
        isFeatured: false,
        heroImage: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=1200",
        content: JSON.stringify([
            { id: 1, type: "p", text: "The challenge with solar and wind energy isn't generation—it's storage. When the wind stops blowing or the sun goes down, we need massive batteries to keep the lights on." },
            { id: 2, type: "p", text: "By 2030, the millions of EVs parked in driveways could collectively store enough power to replace hundreds of coal plants during peak demand hours." }
        ])
    },
    {
        headline: "The Great Decoupling: How Remote Work is Redrawing the Global Map",
        subhead: "Economic centers are shifting away from expensive coastal cities as talent migrates to quality-of-life havens.",
        category: "Economy",
        author: "Idris Adam",
        slug: "great-decoupling-remote-work",
        status: "Published",
        isFeatured: false,
        heroImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200",
        content: JSON.stringify([
            { id: 1, type: "p", text: "For a century, professional success required physical proximity to capital. You had to be in London, New York, or Tokyo to get the best jobs." },
            { id: 2, type: "p", text: "That tether has snapped. We are seeing a historic migration of high-skilled labor from dense urban cores to mountain towns and rural villages." }
        ])
    },
    {
        headline: "AI is Not a Search Engine—It's a Statistical Guessing Machine",
        subhead: "Understanding why Large Language Models 'hallucinate' is key to using them safely and effectively.",
        category: "Explainers",
        author: "Super Admin",
        slug: "ai-statistical-guessing-machine",
        status: "Published",
        isFeatured: false,
        heroImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200",
        content: JSON.stringify([
            { id: 1, type: "p", text: "When you ask ChatGPT for a fact, it isn't looking it up in a database. It is predicting the next most likely word based on patterns in its training data." },
            { id: 2, type: "p", text: "This fundamental misunderstanding leads people to trust AI for data retrieval when they should be using it for synthesis and creative brainstorming." }
        ])
    },
    {
        headline: "The Renaissance of Analog: Why Gen Z is Buying Film Cameras",
        subhead: "In an era of hyper-filtered social feeds, the physical constraints of film offer a sense of authenticity and presence.",
        category: "Culture",
        author: "Idris Adam",
        slug: "renaissance-of-analog-film",
        status: "Published",
        isFeatured: false,
        heroImage: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=1200",
        content: JSON.stringify([
            { id: 1, type: "p", text: "Digital photography is infinite and perfect. Film is limited and flawed. To a generation raised on the infinite scroll, the finite nature of a 36-exposure roll is a relief." },
            { id: 2, type: "p", text: "The delay between taking a photo and seeing it—the 'waiting period'—changes our relationship with our memories." }
        ])
    }
];

async function seed() {
    console.log('🌱 Starting Editorial Content Seeding...');

    for (const story of sampleStories) {
        try {
            const payload = {
                ...story,
                publishedAt: new Date().toISOString(),
                workflow_status: 'published',
                layout: 'standard',
                scrollySections: JSON.stringify([])
            };

            await databases.createDocument(DB_ID, STORIES_COL, ID.unique(), payload);
            console.log(`✅ Seeded: ${story.headline}`);
        } catch (e) {
            if (e.message.includes('unique')) {
                console.warn(`⏩ Skip: '${story.slug}' already exists.`);
            } else {
                console.error(`❌ Error seeding '${story.headline}':`, e.message);
            }
        }
    }

    console.log('🎉 Editorial Seeding Complete!');
}

seed();
