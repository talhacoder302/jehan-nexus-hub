import type { Metadata } from "next";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Hero } from "@/components/marketing/hero";
import {
  CtaBanner,
  FeaturedWork,
  LogoStrip,
  PortalHighlight,
  ProcessSteps,
  ServicesGrid,
  Testimonials,
} from "@/components/marketing/home-sections";
import { JsonLd } from "@/components/marketing/json-ld";
import { Section, SectionHeading } from "@/components/marketing/section";
import { StatsCounters } from "@/components/marketing/stats-counters";
import { faqs } from "@/content/home";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} | Websites, Social Media & Meta Ads that Grow Revenue` },
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <Hero />
      <LogoStrip />
      <ServicesGrid />
      <StatsCounters />
      <ProcessSteps />
      <FeaturedWork />
      <PortalHighlight />
      <Testimonials />
      <Section id="faq">
        <SectionHeading eyebrow="FAQ" title="Questions we often hear" />
        <FaqAccordion items={faqs} />
      </Section>
      <CtaBanner />
    </>
  );
}
