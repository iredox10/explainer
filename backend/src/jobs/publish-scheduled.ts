import { closeDatabase } from '../db/index.js';
import { logger } from '../lib/logger.js';
import { publishScheduledStories } from '../lib/scheduled-publishing.js';

publishScheduledStories()
    .then(async (result) => {
        logger.info(result, 'scheduled publishing run finished');
        await closeDatabase();
        process.exit(0);
    })
    .catch(async (error) => {
        logger.error({ error }, 'scheduled publishing run failed');
        await closeDatabase();
        process.exit(1);
    });
