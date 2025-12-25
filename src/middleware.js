import { defineMiddleware } from "astro:middleware";
import { serverAdminService } from "./lib/server-appwrite";

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, redirect } = context;
    const pathname = url.pathname;

    // Skip middleware for API routes or static assets if needed
    if (pathname.startsWith('/_image') || pathname.includes('.')) {
        return next();
    }

    // 1. Fetch Global Settings
    try {
        const settings = await serverAdminService.getSettings();
        const isMaintenance = settings?.maintenance_mode;

        console.log(`[Middleware] Path: ${pathname}, Maintenance: ${isMaintenance}`);

        // 2. Logic: If Maintenance is ON
        if (isMaintenance) {
            // Allow Admin & Maintenance page itself
            if (!pathname.startsWith('/admin') && pathname !== '/maintenance') {
                return redirect('/maintenance');
            }
        } else {
            // Logic: If Maintenance is OFF and user is on /maintenance page, send them home
            if (pathname === '/maintenance') {
                return redirect('/');
            }
        }
    } catch (e) {
        console.error("Middleware Error:", e);
    }

    return next();
});
