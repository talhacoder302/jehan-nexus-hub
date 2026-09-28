import { CalendarClock, Mail, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/contact-form";
import { PageHeader, Section } from "@/components/marketing/section";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Book a free strategy call with Jehan Nexus. Tell us about your goals and we'll show you where the quickest wins are.",
  alternates: { canonical: "/contact" },
};

const steps = [
  {
    icon: MessageSquare,
    title: "Tell us about your goals",
    body: "Share where you are and where you want to be.",
  },
  {
    icon: CalendarClock,
    title: "Free 30-minute call",
    body: "We review your marketing and suggest quick wins.",
  },
  { icon: Mail, title: "Clear proposal", body: "Scope, timeline and pricing, with no obligation." },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get a free strategy call"
        description="Fill in the form and we'll get back to you within one business day."
      />
      <Section className="pt-12 sm:pt-16">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
          <aside className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="font-semibold">What happens next</h2>
              <ol className="mt-5 space-y-5">
                {steps.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-sm text-muted-foreground">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="font-semibold">Prefer email?</h2>
              <a
                href={`mailto:${siteConfig.email}`}
                className="mt-2 inline-block text-primary underline-offset-4 hover:underline"
              >
                {siteConfig.email}
              </a>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
