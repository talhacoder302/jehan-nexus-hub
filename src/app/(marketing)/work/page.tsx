import type { Metadata } from "next";
import { CaseStudyCard, CtaBanner } from "@/components/marketing/home-sections";
import { FadeIn } from "@/components/marketing/motion";
import { PageHeader, Section } from "@/components/marketing/section";
import { caseStudies } from "@/content/case-studies";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Case studies from Jehan Nexus showing how websites, social media and Meta Ads work together to grow revenue.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  const hasSamples = caseStudies.some((c) => c.sample);
  return (
    <>
      <PageHeader
        eyebrow="Work"
        title="How we solve real growth problems"
        description="Each engagement starts with the numbers and ends with a report. Here's what that looks like."
      >
        {hasSamples ? (
          <p className="text-sm text-muted-foreground">
            Case studies marked <span className="font-medium text-foreground">Sample</span>{" "}
            illustrate our approach and use example figures.
          </p>
        ) : null}
      </PageHeader>
      <Section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {caseStudies.map((study, i) => (
            <FadeIn key={study.slug} delay={i * 0.06} className="h-full">
              <CaseStudyCard study={study} />
            </FadeIn>
          ))}
        </div>
      </Section>
      <CtaBanner title="Want results like these?" />
    </>
  );
}
