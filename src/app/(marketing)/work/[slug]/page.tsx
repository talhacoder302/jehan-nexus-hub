import { ArrowLeft, CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBanner } from "@/components/marketing/home-sections";
import { Section } from "@/components/marketing/section";
import { Badge } from "@/components/ui/badge";
import { caseStudies, getCaseStudy } from "@/content/case-studies";
import { cn } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const study = getCaseStudy(slug);
  if (!study) return {};
  return {
    title: study.title,
    description: study.summary,
    alternates: { canonical: `/work/${study.slug}` },
  };
}

export default async function CaseStudyPage(props: PageProps<"/work/[slug]">) {
  const { slug } = await props.params;
  const study = getCaseStudy(slug);
  if (!study) notFound();

  return (
    <>
      <div className={cn("bg-linear-to-br text-white", study.accent)}>
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16">
          <Link
            href="/work"
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white"
          >
            <ArrowLeft className="size-4" /> All work
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-sm text-white/85">
              {study.client} · {study.industry}
            </span>
            {study.sample ? (
              <Badge variant="secondary" className="bg-white/20 text-white">
                Sample case study
              </Badge>
            ) : null}
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold text-balance sm:text-5xl">
            {study.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">{study.summary}</p>
          <dl className="mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {study.results.map((r) => (
              <div key={r.label} className="rounded-2xl bg-white/15 p-5 backdrop-blur">
                <dd className="font-heading text-3xl font-semibold">{r.value}</dd>
                <dt className="mt-1 text-sm text-white/80">{r.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <Section>
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Services
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {study.services.map((s) => (
                <Badge key={s} variant="outline">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-10 lg:col-span-2">
            <div>
              <h2 className="text-2xl font-semibold">The challenge</h2>
              <p className="mt-3 text-lg text-muted-foreground">{study.challenge}</p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Our approach</h2>
              <ul className="mt-4 space-y-3">
                {study.approach.map((a) => (
                  <li key={a} className="flex gap-3">
                    <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            {study.sample ? (
              <p className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                This is a sample case study that illustrates our approach. Figures are examples, not
                results from a specific client.
              </p>
            ) : null}
          </div>
        </div>
      </Section>
      <CtaBanner />
    </>
  );
}
