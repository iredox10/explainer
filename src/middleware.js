import { defineMiddleware } from "astro:middleware";
import { serverAdminService } from "./lib/server-appwrite.js";

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, redirect } = context;
    const pathname = url.pathname;

    // 1. Immediate bypass for static/internal assets
    if (pathname.startsWith('/_image') || pathname.startsWith('/@') || (pathname.includes('.') && !pathname.endsWith('.html'))) {
        return next();
    }

    // 2. Defensive Routing Logic
    try {
        // Fetch system state with timeout/fail-safe
        // Wrap in a try block to catch any module-level failures from server-appwrite
        const settings = await (async () => {
            try {
                return await serverAdminService.getSettings();
            } catch (err) {
                console.error("[MIDDLEWARE] Data fetch failed:", err.message);
                return null;
            }
        })();

        const isMaintenance = settings?.maintenance_mode === true;

        // 3. Maintenance Logic
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
        // ABSOLUTE FAIL-SAFE: If anything fails, let the request through to avoid 500
        console.error("[CRITICAL] Middleware bypassed due to error:", e);
    }

    return next();
});
