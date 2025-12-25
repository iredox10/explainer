import { defineMiddleware } from "astro:middleware";
import { serverAdminService } from "./lib/server-appwrite.js";

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, redirect } = context;
    const pathname = url.pathname;

    // 1. Immediate bypass for static/internal assets
    if (pathname.startsWith('/_image') || pathname.startsWith('/@') || (pathname.includes('.') && !pathname.endsWith('.html'))) {
        return next();
    }

    try {
        // 2. Fetch system state with timeout/fail-safe
        const settings = await serverAdminService.getSettings().catch(err => {
            console.error("[MIDDLEWARE] Failed to fetch settings:", err.message);
            return null;
        });

        const isMaintenance = settings?.maintenance_mode === true;

        // 3. Routing Logic
        if (isMaintenance) {
            // Divert public traffic unless it's Admin or the Maintenance page
            if (!pathname.startsWith('/admin') && pathname !== '/maintenance') {
                console.log(`[INFRA-LOCK] Active. Redirecting ${pathname} to /maintenance`);
                const response = redirect('/maintenance', 302);
                response.headers.set('Cache-Control', 'no-store, max-age=0');
                return response;
            }
        } else if (pathname === '/maintenance') {
            // System is online: Release from maintenance page
            return redirect('/', 302);
        }
    } catch (e) {
        // DEFENSIVE: Never crash the entire site due to a middleware error
        console.error("[CRITICAL] Middleware exception:", e);
    }

    return next();
});
