/**
 * SAMPLE CASE STUDIES. These illustrate the page layout and are clearly labelled as samples on the
 * site. Replace them with real, client-approved case studies before launch (set `sample: false`).
 */
export interface CaseStudy {
  slug: string;
  sample: boolean;
  client: string;
  industry: string;
  services: string[];
  title: string;
  summary: string;
  challenge: string;
  approach: string[];
  results: { label: string; value: string }[];
  accent: string;
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "local-bakery-meta-ads",
    sample: true,
    client: "Sample: Neighbourhood Bakery",
    industry: "Food & Beverage",
    services: ["Meta Ads", "Social Media Management"],
    title: "Turning a weekend brunch into a fully booked weekly ritual",
    summary:
      "How a structured Meta Ads test plan and approval-driven content calendar could fill tables on quiet days.",
    challenge:
      "Strong word-of-mouth on weekends, empty tables midweek, and ad spend that had never been tracked beyond boosted posts.",
    approach: [
      "Installed Pixel and Conversions API, and set up a booking event",
      "Built separate prospecting and retargeting campaigns with clear budgets",
      "Tested three offers and six creatives in the first month",
      "Planned a monthly content calendar approved through the client portal",
    ],
    results: [
      { label: "Example ROAS", value: "4.2x" },
      { label: "Example cost per booking", value: "-38%" },
      { label: "Example midweek covers", value: "+55%" },
    ],
    accent: "from-amber-500 to-orange-600",
  },
  {
    slug: "fitness-studio-website",
    sample: true,
    client: "Sample: Boutique Fitness Studio",
    industry: "Health & Fitness",
    services: ["Web Development", "Meta Ads"],
    title: "A website built around one action: book a free trial class",
    summary:
      "Rebuilding a slow, generic site into a focused trial-booking funnel connected to ad campaigns.",
    challenge:
      "A template site that loaded slowly on mobile, buried the trial offer and gave ads nowhere good to send traffic.",
    approach: [
      "Mapped the visitor journey to a single primary call to action",
      "Designed and built a fast Next.js site with a trial booking flow",
      "Created dedicated landing pages for each ad audience",
      "Connected lead events to Meta for optimisation",
    ],
    results: [
      { label: "Example mobile load time", value: "1.4s" },
      { label: "Example trial sign-ups", value: "+2.3x" },
      { label: "Example cost per lead", value: "-41%" },
    ],
    accent: "from-sky-500 to-indigo-600",
  },
  {
    slug: "ecommerce-brand-social",
    sample: true,
    client: "Sample: Independent Skincare Brand",
    industry: "E-commerce",
    services: ["Social Media Management", "Meta Ads"],
    title: "Building a consistent content engine for a small DTC brand",
    summary:
      "Replacing ad-hoc posting with a planned, approved monthly calendar that also feeds paid creative.",
    challenge:
      "Posting was sporadic, creative was inconsistent, and the founder spent hours every week on captions.",
    approach: [
      "Defined content pillars and a recognisable visual style",
      "Produced a full month of posts and reels ahead of time",
      "Used the portal approval flow to cut review time to minutes",
      "Recycled top organic posts into paid creative tests",
    ],
    results: [
      { label: "Example engagement rate", value: "+3.1x" },
      { label: "Example founder hours saved", value: "10 / week" },
      { label: "Example paid ROAS", value: "3.6x" },
    ],
    accent: "from-fuchsia-500 to-violet-600",
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((c) => c.slug === slug);
}
