import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { CtaBanner } from "@/components/marketing/home-sections";
import { JsonLd } from "@/components/marketing/json-ld";
import { PageHeader, Section, SectionHeading } from "@/components/marketing/section";
import { ServiceIcon } from "@/components/marketing/service-icon";
import { getService, services } from "@/content/services";
import { publicEnv } from "@/lib/env";
import { siteConfig } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: service.name,
    description: service.summary,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { title: `${service.name} | ${siteConfig.name}`, description: service.summary },
  };
}

export default async function ServicePage(props: PageProps<"/services/[slug]">) {
  const { slug } = await props.params;
  const service = getService(slug);
  if (!service) notFound();

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.summary,
    provider: { "@type": "Organization", name: siteConfig.name, url: publicEnv.siteUrl },
    url: `${publicEnv.siteUrl}/services/${service.slug}`,
  };

  return (
    <>
      <JsonLd data={serviceJsonLd} />
      <PageHeader eyebrow={service.name} title={service.headline} description={service.summary}>
        <ServiceIcon name={service.icon} className="mt-2" />
      </PageHeader>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">What you can expect</h2>
            <ul className="mt-6 space-y-4">
              {service.outcomes.map((o) => (
                <li key={o} className="flex gap-3">
                  <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Ideal for: </span>
              {service.idealFor}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">What’s included</h2>
            <ul className="mt-6 grid gap-3">
              {service.deliverables.map((d) => (
                <li key={d} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-gradient" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section className="bg-muted/20">
        <SectionHeading
          eyebrow="Process"
          title={`How ${service.name.toLowerCase()} works with us`}
        />
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {service.process.map((step, i) => (
            <li key={step.title} className="rounded-2xl border bg-card p-6">
              <span className="text-brand-gradient font-heading text-3xl font-semibold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionHeading eyebrow="FAQ" title={`${service.name} questions`} />
        <FaqAccordion items={service.faqs} />
      </Section>

      <CtaBanner title={`Let's talk about ${service.name.toLowerCase()}`} />
    </>
  );
}
