import { Inbox, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LeadStatusSelect } from "@/components/admin/lead-status-select";
import { EmptyState, PageTitle } from "@/components/app-shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/constants";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BUDGET_LABELS, SERVICE_LABELS } from "@/lib/validators/lead";
import { listLeads } from "@/server/leads";
import { requireStaffPage } from "@/server/permissions";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage(props: PageProps<"/admin/leads">) {
  const user = await requireStaffPage();
  const params = await props.searchParams;
  const status = LEAD_STATUSES.find((s) => s === params.status) as LeadStatus | undefined;
  const leads = await listLeads(user, status);

  const tabs: { label: string; value?: LeadStatus }[] = [
    { label: "All" },
    ...LEAD_STATUSES.map((s) => ({ label: s[0]!.toUpperCase() + s.slice(1), value: s })),
  ];

  return (
    <>
      <PageTitle title="Leads" description="Enquiries from the website contact form." />
      <nav aria-label="Filter by status" className="mb-4 flex flex-wrap gap-1">
        {tabs.map((t) => {
          const active = t.value === status;
          return (
            <Link
              key={t.label}
              href={t.value ? `/admin/leads?status=${t.value}` : "/admin/leads"}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                active && "bg-muted font-medium text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {leads.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title="No leads here"
          description="New contact form submissions will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {leads.map((l) => (
            <li key={l.id}>
              <Card className="py-4">
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <p className="font-medium">
                      {l.name}
                      {l.company ? (
                        <span className="text-muted-foreground"> · {l.company}</span>
                      ) : null}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <a
                        href={`mailto:${l.email}`}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <Mail className="size-3.5" /> {l.email}
                      </a>
                      {l.phone ? (
                        <a
                          href={`tel:${l.phone}`}
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          <Phone className="size-3.5" /> {l.phone}
                        </a>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{SERVICE_LABELS[l.service]}</Badge>
                      {l.budget ? <Badge variant="outline">{BUDGET_LABELS[l.budget]}</Badge> : null}
                      {l.source !== "website" ? <Badge variant="outline">{l.source}</Badge> : null}
                    </div>
                    <p className="pt-1 text-sm whitespace-pre-wrap">{l.message}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                    <LeadStatusSelect leadId={l.id} status={l.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(l.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
