import pino from 'pino';
import { env } from '../env.js';

export const logger = pino({
    level: env.LOG_LEVEL,
    base: { service: 'explainer-api' },
    redact: {
        paths: ['req.headers.authorization', '*.password', '*.token'],
        remove: true,
    },
});
