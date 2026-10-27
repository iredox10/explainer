import { apiFetch, unwrapDocuments, withQuery } from './api';

export const emailService = {
    async sendCampaign(campaignData) {
        const { subject, html, text, subscriberIds } = campaignData;

        const campaign = await apiFetch('/api/admin/campaigns', {
            method: 'POST',
            body: {
                subject,
                html,
                text,
                subscriberIds,
                send: true
            }
        });

        return {
            success: true,
            campaign,
            results: {
                success: campaign.sentCount || 0,
                failed: campaign.failedCount || 0,
                errors: []
            }
        };
    },

    async getCampaigns() {
        try {
            const payload = await apiFetch(withQuery('/api/admin/campaigns', { limit: 50 }));
            return unwrapDocuments(payload);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            return [];
        }
    },

    async getCampaignStats(campaignId) {
        try {
            const campaign = await apiFetch(`/api/admin/campaigns/${encodeURIComponent(campaignId)}`);
            return {
                totalRecipients: campaign.totalRecipients || 0,
                sentCount: campaign.sentCount || 0,
                failedCount: campaign.failedCount || 0,
                openCount: campaign.openCount || 0,
                clickCount: campaign.clickCount || 0,
                openRate: campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount) * 100 : 0,
                clickRate: campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0
            };
        } catch (error) {
            console.error('Error fetching campaign stats:', error);
            return null;
        }
    },

    async trackOpen(campaignId) {
        try {
            await apiFetch(`/api/campaigns/${encodeURIComponent(campaignId)}/open.gif`, { auth: false });
        } catch (error) {
            console.error('Error tracking open:', error);
        }
    },

    async trackClick(campaignId, url) {
        try {
            await apiFetch(withQuery(`/api/campaigns/${encodeURIComponent(campaignId)}/click`, { url }), { auth: false });
        } catch (error) {
            console.error('Error tracking click:', error);
        }
    }
};

export const emailTemplates = {
    newsletter: (stories, options = {}) => {
        const { siteName = 'Explainer', siteUrl = 'https://explainer.africa' } = options;

        const storiesHtml = stories.map(story => `
            <div style="margin-bottom: 32px; border-bottom: 1px solid #eee; padding-bottom: 24px;">
                ${story.heroImage ? `<img src="${story.heroImage}" alt="${story.headline}" style="width: 100%; max-width: 600px; border-radius: 12px; margin-bottom: 16px;" />` : ''}
                <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700;">
                    <a href="${siteUrl}/article/${story.slug}" style="color: #000; text-decoration: none;">${story.headline}</a>
                </h2>
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">${story.subhead || ''}</p>
                <a href="${siteUrl}/article/${story.slug}" style="display: inline-block; margin-top: 12px; color: #FAFF00; background: #000; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 12px;">READ MORE</a>
            </div>
        `).join('');

        return {
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                    <header style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #FAFF00;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">${siteName}</h1>
                        <p style="margin: 8px 0 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Your Weekly Dispatch</p>
                    </header>
                    <main>${storiesHtml}</main>
                    <footer style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #eee; text-align: center;">
                        <p style="margin: 0; color: #999; font-size: 11px;">
                            You received this email because you subscribed to ${siteName}.<br>
                            <a href="{{unsubscribe_url}}" style="color: #999;">Unsubscribe</a> ·
                            <a href="${siteUrl}" style="color: #999;">Visit Site</a>
                        </p>
                    </footer>
                </body>
                </html>
            `,
            text: `
${siteName}
Your Weekly Dispatch

${stories.map(s => `${s.headline}\n${s.subhead || ''}\nRead: ${siteUrl}/article/${s.slug}\n`).join('\n---\n\n')}

---
You received this email because you subscribed to ${siteName}.
Unsubscribe: {{unsubscribe_url}}
            `.trim()
        };
    },

    breaking: (story, options = {}) => {
        const { siteName = 'Explainer', siteUrl = 'https://explainer.africa' } = options;

        return {
            html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"></head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                    <div style="background: #FAFF00; color: #000; padding: 8px 16px; text-align: center; font-weight: 700; font-size: 11px; letter-spacing: 2px; margin-bottom: 24px;">BREAKING NEWS</div>
                    <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 800;">${story.headline}</h1>
                    ${story.heroImage ? `<img src="${story.heroImage}" style="width: 100%; border-radius: 12px; margin-bottom: 16px;" />` : ''}
                    <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">${story.subhead || ''}</p>
                    <a href="${siteUrl}/article/${story.slug}" style="display: inline-block; background: #000; color: #FAFF00; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700;">READ FULL STORY</a>
                </body>
                </html>
            `,
            text: `[BREAKING] ${story.headline}\n\n${story.subhead || ''}\n\nRead full story: ${siteUrl}/article/${story.slug}`
        };
    },

    welcome: (options = {}) => {
        const { siteName = 'Explainer', siteUrl = 'https://explainer.africa' } = options;

        return {
            html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"></head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                    <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 800;">Welcome to ${siteName}</h1>
                    <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">You're now part of our community. We'll send you the most important stories and analyses that help you understand Africa better.</p>
                    <a href="${siteUrl}" style="display: inline-block; background: #000; color: #FAFF00; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700;">EXPLORE STORIES</a>
                </body>
                </html>
            `,
            text: `Welcome to ${siteName}!\n\nYou're now part of our community. We'll send you the most important stories and analyses that help you understand Africa better.\n\nExplore stories: ${siteUrl}`
        };
    }
};
