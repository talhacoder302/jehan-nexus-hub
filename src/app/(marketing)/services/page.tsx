import { ArrowRight, CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CtaBanner } from "@/components/marketing/home-sections";
import { FadeIn } from "@/components/marketing/motion";
import { PageHeader, Section } from "@/components/marketing/section";
import { ServiceIcon } from "@/components/marketing/service-icon";
import { Button } from "@/components/ui/button";
import { services } from "@/content/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Web development, social media management and Meta Ads from Jehan Nexus, each built around measurable outcomes and reported live in your client portal.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Everything you need to grow on the web and on Meta"
        description="Pick one service or combine them. Either way you get a clear plan, a dedicated manager and full visibility in your client portal."
      />
      <Section>
        <div className="space-y-8">
          {services.map((s, i) => (
            <FadeIn key={s.slug} delay={i * 0.05}>
              <article className="grid gap-8 rounded-3xl border bg-card p-6 sm:p-10 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <ServiceIcon name={s.icon} />
                  <h2 className="mt-5 text-2xl font-semibold sm:text-3xl">{s.name}</h2>
                  <p className="mt-3 text-muted-foreground">{s.headline}</p>
                  <Button asChild className="mt-6">
                    <Link href={`/services/${s.slug}`}>
                      Explore {s.name} <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:col-span-3">
                  <div>
                    <h3 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                      Outcomes
                    </h3>
                    <ul className="space-y-2.5">
                      {s.outcomes.map((o) => (
                        <li key={o} className="flex gap-2.5 text-sm">
                          <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                      What’s included
                    </h3>
                    <ul className="space-y-2.5 text-sm text-muted-foreground">
                      {s.deliverables.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </Section>
      <CtaBanner />
    </>
  );
}
