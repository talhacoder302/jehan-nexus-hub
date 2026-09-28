import { PageHeader, Section } from "./section";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHeader title={title} description={`Last updated ${updated}`} />
      <Section className="pt-12 sm:pt-16">
        <article className="mx-auto max-w-3xl space-y-10">
          <p className="text-lg text-muted-foreground">{intro}</p>
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl font-semibold">{s.heading}</h2>
              <div className="mt-3 space-y-3 text-muted-foreground">
                {s.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))}
          <p className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            This page is a general template and should be reviewed by a qualified legal professional
            for your jurisdiction before launch.
          </p>
        </article>
      </Section>
    </>
  );
}
