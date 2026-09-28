import "server-only";
import { Resend } from "resend";
import { features, serverEnv } from "@/lib/env";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

let client: Resend | undefined;

/**
 * Sends a transactional email through Resend. When Resend is not configured the message is logged
 * instead, so invites and resets still work in development (copy the link from the server log).
 */
export async function sendEmail(message: EmailMessage): Promise<{ delivered: boolean }> {
  const env = serverEnv();
  if (!features().resend || !env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.info(
      `[email:not-configured] to=${String(message.to)} subject="${message.subject}"\n${message.text}`,
    );
    return { delivered: false };
  }

  client ??= new Resend(env.RESEND_API_KEY);
  const { error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
    replyTo: message.replyTo,
  });
  if (error) {
    console.error("[email:error]", error.name, error.message);
    return { delivered: false };
  }
  return { delivered: true };
}

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

/** Minimal, email-client-safe layout. All dynamic values are escaped. */
export function renderEmail(opts: {
  heading: string;
  paragraphs: string[];
  cta?: { label: string; url: string };
  footer?: string;
}): { html: string; text: string } {
  const body = opts.paragraphs
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6;color:#334155">${escapeHtml(p)}</p>`)
    .join("");
  const cta = opts.cta
    ? `<p style="margin:24px 0"><a href="${escapeHtml(opts.cta.url)}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(opts.cta.label)}</a></p>
       <p style="margin:0 0 16px;font-size:12px;color:#64748b">Or paste this link into your browser:<br>${escapeHtml(opts.cta.url)}</p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Segoe UI,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e2e8f0">
  <tr><td>
    <p style="margin:0 0 24px;font-weight:700;font-size:18px;color:#4f46e5">Jehan Nexus</p>
    <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a">${escapeHtml(opts.heading)}</h1>
    ${body}${cta}
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">${escapeHtml(opts.footer ?? "You received this email because of your Jehan Nexus account.")}</p>
  </td></tr></table></td></tr></table></body></html>`;
  const text = [
    opts.heading,
    "",
    ...opts.paragraphs,
    ...(opts.cta ? ["", `${opts.cta.label}: ${opts.cta.url}`] : []),
  ].join("\n");
  return { html, text };
}
