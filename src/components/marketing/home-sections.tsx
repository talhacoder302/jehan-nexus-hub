import {
  ArrowRight,
  Bell,
  CalendarCheck,
  CircleCheck,
  FileText,
  MessageSquare,
  Quote,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { caseStudies, type CaseStudy } from "@/content/case-studies";
import { processSteps, trustedBy } from "@/content/home";
import { services } from "@/content/services";
import { testimonials } from "@/content/testimonials";
import { cn } from "@/lib/utils";
import { FadeIn } from "./motion";
import { Section, SectionHeading } from "./section";
import { ServiceIcon } from "./service-icon";

export function LogoStrip() {
  return (
    <section aria-label="Trusted by" className="border-y bg-muted/20 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Trusted by growing brands
          {trustedBy.placeholder ? <span className="sr-only"> (placeholder names)</span> : null}
        </p>
        <ul className="grid grid-cols-2 items-center gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          {trustedBy.names.map((name) => (
            <li
              key={name}
              className="text-center font-heading text-lg font-semibold tracking-tight text-muted-foreground/70"
              title={
                trustedBy.placeholder ? "Placeholder: replace with a real client logo" : undefined
              }
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ServicesGrid() {
  return (
    <Section id="services">
      <SectionHeading
        eyebrow="Services"
        title="Three services, one goal: measurable growth"
        description="Each service works on its own, and they work best together: a site that converts, content that builds trust and ads that bring the right people in."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {services.map((s, i) => (
          <FadeIn key={s.slug} delay={i * 0.08} className="h-full">
            <Link
              href={`/services/${s.slug}`}
              className="group flex h-full flex-col rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
            >
              <ServiceIcon name={s.icon} />
              <h3 className="mt-5 text-xl font-semibold">{s.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.summary}</p>
              <ul className="mt-5 space-y-2.5">
                {s.outcomes.slice(0, 3).map((o) => (
                  <li key={o} className="flex gap-2.5 text-sm">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium text-primary">
                Learn more
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}

export function ProcessSteps() {
  return (
    <Section id="process" className="bg-muted/20">
      <SectionHeading
        eyebrow="How we work"
        title="A simple process with no black boxes"
        description="Every engagement follows the same four steps, and you can see where things stand at any time in your portal."
      />
      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {processSteps.map((step, i) => (
          <FadeIn
            key={step.title}
            as="li"
            delay={i * 0.08}
            className="relative h-full rounded-2xl border bg-card p-6"
          >
            <span className="text-brand-gradient font-heading text-4xl font-semibold">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
          </FadeIn>
        ))}
      </ol>
    </Section>
  );
}

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <Link
      href={`/work/${study.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
    >
      <div className={cn("relative h-40 bg-linear-to-br p-5 text-white", study.accent)}>
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium opacity-90">{study.industry}</span>
          {study.sample ? (
            <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur">
              Sample
            </Badge>
          ) : null}
        </div>
        <div className="absolute bottom-5 left-5 flex gap-4">
          {study.results.slice(0, 2).map((r) => (
            <div key={r.label}>
              <p className="font-heading text-2xl font-semibold">{r.value}</p>
              <p className="text-xs opacity-80">{r.label.replace(/^Example /, "")}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm text-muted-foreground">{study.client}</p>
        <h3 className="mt-1 text-lg font-semibold">{study.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{study.summary}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          {study.services.map((s) => (
            <Badge key={s} variant="outline">
              {s}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function FeaturedWork() {
  return (
    <Section id="work">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading
          eyebrow="Work"
          title="What this looks like in practice"
          description="Sample case studies showing how we approach common growth problems."
          align="left"
        />
        <Button asChild variant="outline" className="mb-12 shrink-0">
          <Link href="/work">
            All work <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {caseStudies.map((study, i) => (
          <FadeIn key={study.slug} delay={i * 0.08} className="h-full">
            <CaseStudyCard study={study} />
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}

const portalFeatures = [
  {
    icon: CalendarCheck,
    title: "Content calendar",
    body: "See every scheduled post for the month at a glance.",
  },
  {
    icon: CircleCheck,
    title: "One-click approvals",
    body: "Approve, or request changes with a comment.",
  },
  {
    icon: TrendingUp,
    title: "Live ad performance",
    body: "Spend, reach, CTR and ROAS, updated daily.",
  },
  { icon: FileText, title: "Monthly reports", body: "A clean PDF summary delivered on the 1st." },
];

export function PortalHighlight() {
  return (
    <Section id="portal" className="overflow-hidden">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Client portal"
            title="Full transparency, built in"
            description="No more chasing screenshots or waiting for month-end. Every client gets a private portal with their calendar, approvals, live Meta Ads results and reports."
            align="left"
          />
          <ul className="-mt-4 grid gap-5 sm:grid-cols-2">
            {portalFeatures.map(({ icon: Icon, title, body }) => (
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
          </ul>
        </div>

        <FadeIn>
          <PortalMockup />
        </FadeIn>
      </div>
    </Section>
  );
}

/** Static illustration of the portal dashboard (decorative, not real data). */
function PortalMockup() {
  const bars = [38, 52, 44, 61, 58, 72, 66, 80, 74, 88, 83, 95];
  return (
    <div aria-hidden="true" className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-gradient opacity-20 blur-2xl" />
      <div className="rounded-2xl border bg-card p-5 shadow-2xl shadow-primary/10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/70" />
            <span className="size-2.5 rounded-full bg-amber-400/70" />
            <span className="size-2.5 rounded-full bg-green-400/70" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Bell className="size-3.5" /> 2 posts awaiting approval
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            ["Spend", "$4,820"],
            ["ROAS", "3.9x"],
            ["CTR", "2.1%"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="font-heading text-lg font-semibold">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex h-32 items-end gap-1.5 rounded-xl border bg-background/60 p-3">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-brand-gradient opacity-80"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl border bg-background/60 p-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-linear-to-br from-amber-400 to-orange-500" />
            <div>
              <p className="text-sm font-medium">Weekly offer post</p>
              <p className="text-xs text-muted-foreground">Instagram · Thu 10:00</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className="rounded-md border px-2 py-1 text-xs">
              <MessageSquare className="inline size-3" /> Changes
            </span>
            <span className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">
              Approve
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <Section id="testimonials" className="bg-muted/20">
      <SectionHeading eyebrow="Testimonials" title="What clients say" />
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <FadeIn key={i} delay={i * 0.08} className="h-full">
            <figure className="flex h-full flex-col rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <Quote className="size-6 text-primary" />
                {t.placeholder ? <Badge variant="outline">Placeholder</Badge> : null}
              </div>
              <blockquote className="mt-4 flex-1 text-pretty text-muted-foreground">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 text-sm">
                <span className="font-semibold">{t.name}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {t.role}, {t.company}
                </span>
              </figcaption>
            </figure>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}

export function CtaBanner({
  title = "Ready to see what's possible?",
  body = "Book a free 30-minute strategy call. We'll review your current marketing and show you where the quickest wins are, with no obligation.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-14 text-center text-white sm:px-12 sm:py-20">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]"
        />
        <h2 className="relative mx-auto max-w-2xl text-3xl font-semibold text-balance sm:text-4xl">
          {title}
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/85">{body}</p>
        <Button asChild size="lg" variant="secondary" className="relative mt-8 h-12 px-6 text-base">
          <Link href="/contact">
            Get a Free Strategy Call <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
