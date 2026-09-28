import "server-only";
import { createHash } from "node:crypto";
import { connectDB } from "@/lib/db";
import { serverEnv } from "@/lib/env";
import { BUDGET_LABELS, SERVICE_LABELS, type ContactValues } from "@/lib/validators/lead";
import { Lead } from "@/models";
import { logActivity } from "./activity";
import { renderEmail, sendEmail } from "./email";
import { absoluteUrl } from "./urls";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;

function hashIp(ip: string) {
  return createHash("sha256").update(`${ip}:${serverEnv().AUTH_SECRET}`).digest("hex");
}

export type SubmitLeadResult = { ok: true } | { ok: false; reason: "rate_limited" };

/**
 * Saves a contact form lead and notifies the agency. Rate limited per IP (hashed, never stored
 * raw) using the leads collection itself, which works across serverless instances.
 */
export async function submitLead(values: ContactValues, ip: string): Promise<SubmitLeadResult> {
  await connectDB();
  const ipHash = hashIp(ip);
  const recent = await Lead.countDocuments({
    ipHash,
    createdAt: { $gte: new Date(Date.now() - WINDOW_MS) },
  });
  if (recent >= MAX_PER_WINDOW) return { ok: false, reason: "rate_limited" };

  const lead = await Lead.create({
    name: values.name,
    email: values.email,
    phone: values.phone,
    company: values.company,
    service: values.service,
    budget: values.budget,
    message: values.message,
    source: "website",
    ipHash,
  });

  await logActivity({
    actorId: null,
    action: "lead.created",
    entity: "lead",
    entityId: lead._id,
    meta: { service: values.service },
  });

  const to = serverEnv().ADMIN_NOTIFY_EMAIL;
  if (to) {
    const { html, text } = renderEmail({
      heading: `New lead: ${values.name}`,
      paragraphs: [
        `Service: ${SERVICE_LABELS[values.service]}`,
        `Budget: ${values.budget ? BUDGET_LABELS[values.budget] : "Not specified"}`,
        `Email: ${values.email}${values.phone ? ` · Phone: ${values.phone}` : ""}`,
        `Company: ${values.company ?? "Not specified"}`,
        values.message,
      ],
      cta: { label: "Open leads inbox", url: absoluteUrl("/admin/leads") },
      footer: "Sent by the contact form on the Jehan Nexus website.",
    });
    await sendEmail({ to, subject: `New lead: ${values.name}`, html, text, replyTo: values.email });
  } else {
    console.info(`[lead] ${lead._id.toString()} saved; ADMIN_NOTIFY_EMAIL not set, no email sent`);
  }

  return { ok: true };
}
