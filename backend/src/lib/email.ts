import { env } from '../env.js';
import { logger } from './logger.js';

type SendEmailInput = {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{ success: boolean; id?: string; simulated?: boolean }> {
    if (!env.RESEND_API_KEY) {
        logger.info({ to: input.to, subject: input.subject }, 'email simulated (RESEND_API_KEY not set)');
        return { success: true, simulated: true };
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: env.EMAIL_FROM,
            to: Array.isArray(input.to) ? input.to : [input.to],
            subject: input.subject,
            html: input.html,
            text: input.text,
        }),
    });

    if (!response.ok) {
        const body = await response.text();
        logger.error({ status: response.status, body }, 'resend email failed');
        return { success: false };
    }

    const data = (await response.json()) as { id?: string };
    return { success: true, id: data.id };
}

export function emailShell(title: string, body: string, cta?: { label: string; url: string }): string {
    return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f5f2;font-family:Helvetica,Arial,sans-serif;color:#111">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px">
      <p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;margin:0 0 28px">Explainer</p>
      <h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.15;margin:0 0 20px">${title}</h1>
      <div style="font-size:15px;line-height:1.6;color:#333">${body}</div>
      ${
            cta
                ? `<p style="margin:28px 0"><a href="${cta.url}" style="display:inline-block;background:#111;color:#fff;padding:13px 22px;text-decoration:none;font-weight:700">${cta.label}</a></p>
                   <p style="font-size:12px;color:#777;word-break:break-all">${cta.url}</p>`
                : ''
        }
      <hr style="border:none;border-top:1px solid #ddd;margin:32px 0">
      <p style="font-size:12px;color:#888">Explainer — visual journalism that makes sense of the world.</p>
    </div>
  </body>
</html>`;
}
