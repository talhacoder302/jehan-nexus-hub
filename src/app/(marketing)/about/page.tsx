import { Eye, Gauge, HeartHandshake, LineChart } from "lucide-react";
import type { Metadata } from "next";
import { CtaBanner } from "@/components/marketing/home-sections";
import { FadeIn } from "@/components/marketing/motion";
import { PageHeader, Section, SectionHeading } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "About",
  description:
    "Jehan Nexus is a digital marketing agency built on transparency: clear plans, measurable goals and a client portal that shows every result.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    icon: Eye,
    title: "Radical transparency",
    body: "You see what we see. Your calendar, approvals and ad results live in your portal, not in our inbox.",
  },
  {
    icon: LineChart,
    title: "Outcomes over output",
    body: "We measure success in leads, sales and return on ad spend, not in the number of posts or reports.",
  },
  {
    icon: Gauge,
    title: "Speed with care",
    body: "Fast turnarounds, but nothing goes live without your approval and our quality checks.",
  },
  {
    icon: HeartHandshake,
    title: "Partnership",
    body: "One dedicated point of contact who knows your business and answers in plain language.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="An agency you can actually see into"
        description="Jehan Nexus exists because too many businesses pay for marketing without knowing what it's doing for them. We set out to change that."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-5 text-lg text-muted-foreground">
            <p>
              We’re a digital marketing agency focused on three things that move the needle for
              growing businesses: websites that convert, social media that builds trust, and Meta
              Ads that bring in customers profitably.
            </p>
            <p>
              What makes us different is how we work. Every client gets a private portal where they
              can see upcoming content, approve posts in one click, track ad performance daily and
              download monthly reports. No chasing, no guesswork.
            </p>
            <p>
              We keep our client list focused so every account gets senior attention and a plan
              built around real numbers.
            </p>
          </div>
          <div className="rounded-3xl border bg-card p-8">
            <h2 className="text-xl font-semibold">What you get with every engagement</h2>
            <ul className="mt-6 space-y-4 text-muted-foreground">
              <li>A dedicated account manager</li>
              <li>A written strategy with agreed targets</li>
              <li>Client portal access for your team</li>
              <li>Content approvals before anything is published</li>
              <li>Live Meta Ads dashboard, updated daily</li>
              <li>Monthly PDF report and review call</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section className="bg-muted/20">
        <SectionHeading eyebrow="Values" title="How we work" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Icon, title, body }, i) => (
            <FadeIn key={title} delay={i * 0.06} className="h-full">
              <div className="h-full rounded-2xl border bg-card p-6">
                <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      <CtaBanner title="Let's see if we're a good fit" />
    </>
  );
}
