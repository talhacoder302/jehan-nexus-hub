/** Shared enums used by models, validators and UI. Kept free of server imports so client code can use them. */

export const USER_ROLES = ["admin", "manager", "client"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const STAFF_ROLES: readonly UserRole[] = ["admin", "manager"];

export const USER_STATUSES = ["invited", "active", "disabled"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const CLIENT_STATUSES = ["active", "paused", "archived"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_PLANS = ["starter", "growth", "scale", "custom"] as const;
export type ClientPlan = (typeof CLIENT_PLANS)[number];

export const PLATFORMS = ["facebook", "instagram"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const POST_STATUSES = [
  "draft",
  "pending_approval",
  "changes_requested",
  "approved",
  "published",
] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending approval",
  changes_requested: "Changes requested",
  approved: "Approved",
  published: "Published",
};

/** Hex colors (not CSS vars) because FullCalendar and the PDF renderer need concrete values. */
export const POST_STATUS_COLORS: Record<PostStatus, string> = {
  draft: "#64748b",
  pending_approval: "#f59e0b",
  changes_requested: "#ef4444",
  approved: "#22c55e",
  published: "#6366f1",
};

export const NOTIFICATION_TYPES = [
  "post_pending_approval",
  "post_approved",
  "post_changes_requested",
  "comment_added",
  "report_ready",
  "user_invited",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const SERVICE_OPTIONS = [
  "web-development",
  "social-media-management",
  "meta-ads",
  "not-sure",
] as const;
export type ServiceOption = (typeof SERVICE_OPTIONS)[number];

export const BUDGET_OPTIONS = ["under-1k", "1k-3k", "3k-10k", "10k-plus"] as const;
export type BudgetOption = (typeof BUDGET_OPTIONS)[number];

export const TOKEN_PURPOSES = ["invite", "password_reset"] as const;
export type TokenPurpose = (typeof TOKEN_PURPOSES)[number];

export const ACTIVITY_ENTITIES = [
  "client",
  "user",
  "post",
  "comment",
  "report",
  "lead",
  "insight",
] as const;
export type ActivityEntity = (typeof ACTIVITY_ENTITIES)[number];
