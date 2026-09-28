"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { contactSchema } from "@/lib/validators/lead";
import { submitLead } from "@/server/leads";
import type { ActionResult } from "@/types/actions";

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function submitContactAction(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // Honeypot filled: pretend success so bots get no signal.
  if (parsed.data.website) return { ok: true };

  try {
    const result = await submitLead(parsed.data, await clientIp());
    if (!result.ok) {
      return {
        ok: false,
        error: "You've sent a few messages already. Please wait a few minutes and try again.",
      };
    }
    return { ok: true, message: "Thanks! We'll be in touch within one business day." };
  } catch (error) {
    console.error("[contact] submission failed", error);
    return {
      ok: false,
      error: "Something went wrong on our side. Please email us directly and we'll reply quickly.",
    };
  }
}
