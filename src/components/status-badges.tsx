import { Badge } from "@/components/ui/badge";
import {
  POST_STATUS_LABELS,
  type LeadStatus,
  type PostStatus,
  type UserStatus,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const tone = {
  gray: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  red: "bg-red-500/15 text-red-700 dark:text-red-300",
  green: "bg-green-500/15 text-green-700 dark:text-green-300",
  indigo: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  sky: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
} as const;

function Pill({ color, children }: { color: keyof typeof tone; children: React.ReactNode }) {
  return (
    <Badge variant="secondary" className={cn("border-0 font-medium", tone[color])}>
      {children}
    </Badge>
  );
}

const POST_TONE: Record<PostStatus, keyof typeof tone> = {
  draft: "gray",
  pending_approval: "amber",
  changes_requested: "red",
  approved: "green",
  published: "indigo",
};

export function PostStatusBadge({ status }: { status: PostStatus }) {
  return <Pill color={POST_TONE[status]}>{POST_STATUS_LABELS[status]}</Pill>;
}

const USER_TONE: Record<UserStatus, keyof typeof tone> = {
  invited: "amber",
  active: "green",
  disabled: "gray",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Pill color={USER_TONE[status]}>{status[0]!.toUpperCase() + status.slice(1)}</Pill>;
}

const LEAD_TONE: Record<LeadStatus, keyof typeof tone> = {
  new: "sky",
  contacted: "amber",
  qualified: "indigo",
  won: "green",
  lost: "gray",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Pill color={LEAD_TONE[status]}>{status[0]!.toUpperCase() + status.slice(1)}</Pill>;
}
