import "server-only";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import type { UserRole, UserStatus } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import type { InviteUserValues } from "@/lib/validators/auth";
import { Client, User } from "@/models";
import { logActivity } from "./activity";
import { renderEmail, sendEmail } from "./email";
import { AuthorizationError, assertClientAccess, type SessionUser } from "./permissions";
import { consumeToken, createToken, peekToken } from "./tokens";
import { absoluteUrl } from "./urls";

const BCRYPT_ROUNDS = 12;

export class UserServiceError extends Error {}

/**
 * Invites a user by email. Admins can invite any role; managers can only invite client users for
 * clients assigned to them. Re-inviting an invited user issues a fresh link.
 */
export async function inviteUser(actor: SessionUser, input: InviteUserValues) {
  await connectDB();
  if (actor.role === "client") throw new AuthorizationError();
  if (actor.role === "manager" && input.role !== "client") {
    throw new AuthorizationError("Managers can only invite client users.");
  }
  let clientName: string | undefined;
  if (input.role === "client") {
    if (!input.clientId) throw new UserServiceError("Choose a client for this user.");
    await assertClientAccess(actor, input.clientId);
    const client = await Client.findById(input.clientId, { name: 1 }).lean();
    if (!client) throw new UserServiceError("Client not found.");
    clientName = client.name;
  }

  const existing = await User.findOne({ email: input.email });
  if (existing && existing.status !== "invited") {
    throw new UserServiceError("A user with this email already exists.");
  }

  const user = existing ?? new User({ email: input.email, status: "invited" });
  user.name = input.name;
  user.role = input.role;
  user.clientId = input.role === "client" ? new Types.ObjectId(input.clientId) : null;
  await user.save();

  const token = await createToken(user._id, "invite");
  const link = absoluteUrl(`/invite?token=${encodeURIComponent(token)}`);
  const { html, text } = renderEmail({
    heading: "You're invited to the Jehan Nexus portal",
    paragraphs: [
      `Hi ${input.name},`,
      clientName
        ? `${actor.name} has invited you to the ${clientName} client portal, where you can review and approve content, see ad performance and download monthly reports.`
        : `${actor.name} has invited you to the Jehan Nexus agency portal as a ${input.role}.`,
      "This invitation link expires in 7 days.",
    ],
    cta: { label: "Accept invitation", url: link },
  });
  const { delivered } = await sendEmail({
    to: input.email,
    subject: "Your Jehan Nexus portal invitation",
    html,
    text,
  });

  await logActivity({
    actorId: actor.id,
    clientId: input.clientId,
    action: existing ? "user.reinvited" : "user.invited",
    entity: "user",
    entityId: user._id,
    meta: { email: input.email, role: input.role },
  });

  // When email isn't configured, staff get the link directly so they can share it.
  return { userId: user._id.toString(), delivered, inviteLink: delivered ? undefined : link };
}

export async function getInviteDetails(token: string) {
  await connectDB();
  const record = await peekToken(token, "invite");
  if (!record) return null;
  const user = await User.findById(record.userId, { name: 1, email: 1, status: 1 }).lean();
  if (!user || user.status !== "invited") return null;
  return { name: user.name, email: user.email };
}

export async function acceptInvite(input: { token: string; name: string; password: string }) {
  await connectDB();
  const userId = await consumeToken(input.token, "invite");
  if (!userId) throw new UserServiceError("This invitation link is invalid or has expired.");
  const user = await User.findById(userId);
  if (!user || user.status !== "invited") {
    throw new UserServiceError("This invitation has already been used.");
  }
  user.name = input.name;
  user.passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  user.status = "active";
  await user.save();
  await logActivity({
    actorId: user._id,
    clientId: user.clientId,
    action: "user.activated",
    entity: "user",
    entityId: user._id,
  });
  return { email: user.email };
}

/** Always resolves without revealing whether the email exists. */
export async function requestPasswordReset(email: string): Promise<void> {
  await connectDB();
  const user = await User.findOne({ email, status: "active" });
  if (!user) return;
  const token = await createToken(user._id, "password_reset");
  const link = absoluteUrl(`/reset-password?token=${encodeURIComponent(token)}`);
  const { html, text } = renderEmail({
    heading: "Reset your password",
    paragraphs: [
      `Hi ${user.name},`,
      "We received a request to reset your Jehan Nexus portal password. The link below expires in 1 hour.",
      "If you didn't ask for this, you can safely ignore this email.",
    ],
    cta: { label: "Choose a new password", url: link },
  });
  await sendEmail({ to: user.email, subject: "Reset your Jehan Nexus password", html, text });
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  await connectDB();
  return !!(await peekToken(token, "password_reset"));
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await connectDB();
  const userId = await consumeToken(token, "password_reset");
  if (!userId) throw new UserServiceError("This reset link is invalid or has expired.");
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const res = await User.updateOne({ _id: userId, status: "active" }, { $set: { passwordHash } });
  if (res.matchedCount === 0) throw new UserServiceError("This account is not active.");
  await logActivity({
    actorId: userId,
    action: "user.password_reset",
    entity: "user",
    entityId: userId,
  });
}

export async function changePassword(actor: SessionUser, current: string, next: string) {
  await connectDB();
  const user = await User.findById(actor.id).select("+passwordHash");
  if (!user?.passwordHash || !(await bcrypt.compare(current, user.passwordHash))) {
    throw new UserServiceError("Your current password is incorrect.");
  }
  user.passwordHash = await bcrypt.hash(next, BCRYPT_ROUNDS);
  await user.save();
}

export async function updateProfile(actor: SessionUser, name: string) {
  await connectDB();
  await User.updateOne({ _id: actor.id }, { $set: { name } });
}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  clientId: string | null;
  clientName: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

/** Users visible to staff: admins see everyone; managers see client users of their clients. */
export async function listUsers(actor: SessionUser): Promise<UserListItem[]> {
  await connectDB();
  if (actor.role === "client") throw new AuthorizationError();
  const filter: Record<string, unknown> = {};
  if (actor.role === "manager") {
    const clients = await Client.find({ assignedManagers: actor.id }, { _id: 1 }).lean();
    filter.clientId = { $in: clients.map((c) => c._id) };
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).lean();
  const clientIds = [
    ...new Set(users.map((u) => u.clientId?.toString()).filter(Boolean)),
  ] as string[];
  const clients = await Client.find({ _id: { $in: clientIds } }, { name: 1 }).lean();
  const names = new Map(clients.map((c) => [c._id.toString(), c.name]));
  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    clientId: u.clientId?.toString() ?? null,
    clientName: u.clientId ? (names.get(u.clientId.toString()) ?? null) : null,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }));
}

/** Admin-only role change. Admins cannot demote or disable themselves. */
export async function updateUserRole(
  actor: SessionUser,
  userId: string,
  role: UserRole,
  clientId?: string,
) {
  await connectDB();
  if (actor.role !== "admin") throw new AuthorizationError();
  if (actor.id === userId) throw new UserServiceError("You can't change your own role.");
  const user = await User.findById(userId);
  if (!user) throw new UserServiceError("User not found.");
  if (role === "client" && !clientId && !user.clientId) {
    throw new UserServiceError("Choose a client for a client user.");
  }
  user.role = role;
  if (role === "client" && clientId) user.clientId = new Types.ObjectId(clientId);
  await user.save();
  await logActivity({
    actorId: actor.id,
    clientId: user.clientId,
    action: "user.role_changed",
    entity: "user",
    entityId: user._id,
    meta: { role },
  });
}

export async function setUserDisabled(actor: SessionUser, userId: string, disabled: boolean) {
  await connectDB();
  if (actor.role === "client") throw new AuthorizationError();
  if (actor.id === userId) throw new UserServiceError("You can't disable your own account.");
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new UserServiceError("User not found.");
  if (actor.role === "manager") {
    if (user.role !== "client" || !user.clientId) throw new AuthorizationError();
    await assertClientAccess(actor, user.clientId.toString());
  }
  user.status = disabled ? "disabled" : user.passwordHash ? "active" : "invited";
  await user.save();
  await logActivity({
    actorId: actor.id,
    clientId: user.clientId,
    action: disabled ? "user.disabled" : "user.enabled",
    entity: "user",
    entityId: user._id,
  });
}
