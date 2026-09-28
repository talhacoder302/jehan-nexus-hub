import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { Types } from "mongoose";
import type { TokenPurpose } from "@/lib/constants";
import { VerificationToken } from "@/models";

const TTL: Record<TokenPurpose, number> = {
  invite: 7 * 24 * 60 * 60 * 1000,
  password_reset: 60 * 60 * 1000,
};

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Creates a single-use token and returns the raw value (only its hash is stored). */
export async function createToken(userId: Types.ObjectId, purpose: TokenPurpose): Promise<string> {
  // Invalidate older unused tokens for the same purpose.
  await VerificationToken.deleteMany({ userId, purpose, usedAt: null });
  const raw = randomBytes(32).toString("base64url");
  await VerificationToken.create({
    userId,
    purpose,
    tokenHash: sha256(raw),
    expiresAt: new Date(Date.now() + TTL[purpose]),
  });
  return raw;
}

/** Looks up a valid, unused token without consuming it (for rendering the form). */
export async function peekToken(raw: string, purpose: TokenPurpose) {
  return VerificationToken.findOne({
    tokenHash: sha256(raw),
    purpose,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).lean();
}

/** Atomically marks a token as used. Returns the user id, or null if invalid, expired or reused. */
export async function consumeToken(
  raw: string,
  purpose: TokenPurpose,
): Promise<Types.ObjectId | null> {
  const token = await VerificationToken.findOneAndUpdate(
    { tokenHash: sha256(raw), purpose, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { returnDocument: "after" },
  ).lean();
  return token?.userId ?? null;
}
