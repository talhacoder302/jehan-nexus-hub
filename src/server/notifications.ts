import "server-only";
import { Types } from "mongoose";
import type { NotificationType } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { Client, Notification, User } from "@/models";
import { renderEmail, sendEmail } from "./email";
import { pushToUsers } from "./pusher";
import { absoluteUrl } from "./urls";

export interface NotificationInput {
  type: NotificationType;
  title: string;
  link?: string;
  /** Also send an email (Resend) with this body text. */
  email?: { subject: string; body: string; cta?: string };
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

/** Stores in-app notifications, pushes them in real time and optionally emails recipients. */
export async function notifyUsers(userIds: string[], input: NotificationInput): Promise<void> {
  const ids = [...new Set(userIds)].filter((id) => Types.ObjectId.isValid(id));
  if (!ids.length) return;
  await connectDB();
  const docs = await Notification.insertMany(
    ids.map((userId) => ({ userId, type: input.type, title: input.title, link: input.link })),
  );
  await pushToUsers(ids, "notification", {
    type: input.type,
    title: input.title,
    link: input.link ?? null,
    createdAt: docs[0]?.createdAt.toISOString(),
  });

  if (input.email) {
    const recipients = await User.find(
      { _id: { $in: ids }, status: "active" },
      { email: 1, name: 1 },
    ).lean();
    await Promise.all(
      recipients.map((r) => {
        const { html, text } = renderEmail({
          heading: input.title,
          paragraphs: [`Hi ${r.name.split(" ")[0]},`, input.email!.body],
          cta: input.link
            ? { label: input.email!.cta ?? "Open in portal", url: absoluteUrl(input.link) }
            : undefined,
        });
        return sendEmail({ to: r.email, subject: input.email!.subject, html, text });
      }),
    );
  }
}

/** Active client users belonging to a client. */
export async function clientUserIds(clientId: string | Types.ObjectId): Promise<string[]> {
  await connectDB();
  const users = await User.find({ clientId, role: "client", status: "active" }, { _id: 1 }).lean();
  return users.map((u) => u._id.toString());
}

/** Managers assigned to a client (falls back to admins when none are assigned). */
export async function staffUserIdsForClient(clientId: string | Types.ObjectId): Promise<string[]> {
  await connectDB();
  const client = await Client.findById(clientId, { assignedManagers: 1 }).lean();
  const managers = client?.assignedManagers.map((m) => m.toString()) ?? [];
  if (managers.length) {
    const active = await User.find({ _id: { $in: managers }, status: "active" }, { _id: 1 }).lean();
    if (active.length) return active.map((u) => u._id.toString());
  }
  const admins = await User.find({ role: "admin", status: "active" }, { _id: 1 }).lean();
  return admins.map((u) => u._id.toString());
}

export async function listNotifications(
  userId: string,
  limit = 20,
): Promise<{ items: NotificationItem[]; unread: number }> {
  await connectDB();
  const uid = new Types.ObjectId(userId);
  const [items, unread] = await Promise.all([
    Notification.find({ userId: uid }).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ userId: uid, read: false }),
  ]);
  return {
    unread,
    items: items.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      title: n.title,
      link: n.link ?? null,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

/** Marks the given notifications (or all) as read. Always scoped to the owner. */
export async function markNotificationsRead(userId: string, ids?: string[]): Promise<void> {
  await connectDB();
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId), read: false };
  if (ids?.length) filter._id = { $in: ids.filter((id) => Types.ObjectId.isValid(id)) };
  await Notification.updateMany(filter, { $set: { read: true } });
}
