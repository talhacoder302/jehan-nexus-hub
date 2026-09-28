export type ServiceIcon = "web" | "social" | "ads";

export interface Service {
  slug: "web-development" | "social-media-management" | "meta-ads";
  name: string;
  icon: ServiceIcon;
  headline: string;
  summary: string;
  outcomes: string[];
  deliverables: string[];
  process: { title: string; body: string }[];
  idealFor: string;
  faqs: { q: string; a: string }[];
}

export const services: Service[] = [
  {
    slug: "web-development",
    name: "Web Development",
    icon: "web",
    headline: "Websites that load fast, rank well and turn visitors into customers.",
    summary:
      "Conversion-focused websites and landing pages built on a modern stack, designed around one question: what should a visitor do next?",
    outcomes: [
      "More enquiries and sales from the traffic you already have",
      "Pages that load in under two seconds on mobile",
      "Search-friendly structure that compounds over time",
      "A site your team can update without calling a developer",
    ],
    deliverables: [
      "Conversion-led UX and copy structure",
      "Custom design system matched to your brand",
      "Next.js build with Core Web Vitals in the green",
      "Technical SEO, analytics and Meta Pixel / CAPI setup",
      "CMS or editable content where it matters",
      "Launch checklist, training and 30 days of support",
    ],
    process: [
      {
        title: "Discovery",
        body: "Goals, audience, competitors and the actions that matter most.",
      },
      {
        title: "Wireframes & copy",
        body: "Page structure and messaging agreed before any pixels.",
      },
      {
        title: "Design & build",
        body: "Pixel-accurate build with weekly previews you can click through.",
      },
      {
        title: "Launch & optimise",
        body: "Tracking verified, speed tuned, then iterate on real data.",
      },
    ],
    idealFor: "Businesses whose website should be their best salesperson.",
    faqs: [
      {
        q: "How long does a website take?",
        a: "Most marketing sites launch in 3–6 weeks depending on page count and content readiness.",
      },
      {
        q: "Can you work with our existing brand?",
        a: "Yes. We extend your brand guidelines into a web design system, or refresh them if needed.",
      },
      {
        q: "Do you handle hosting?",
        a: "We deploy to modern managed hosting and hand over full ownership of the code and accounts.",
      },
    ],
  },
  {
    slug: "social-media-management",
    name: "Social Media Management",
    icon: "social",
    headline: "Consistent, on-brand content that builds an audience you own.",
    summary:
      "A monthly content engine for Facebook and Instagram: strategy, creative, captions, scheduling and community, with every post approved by you in the client portal.",
    outcomes: [
      "A steady posting rhythm without it eating your week",
      "Content that reflects your brand and speaks to buyers",
      "Growing reach and engagement you can see month to month",
      "Full control: nothing goes live without your approval",
    ],
    deliverables: [
      "Monthly content strategy and calendar",
      "Post and reel creative, captions and hashtags",
      "Approval workflow in the Jehan Nexus client portal",
      "Scheduling and publishing across Facebook and Instagram",
      "Community management guidelines",
      "Monthly performance report",
    ],
    process: [
      {
        title: "Brand & audience",
        body: "Voice, pillars and the content your buyers actually engage with.",
      },
      {
        title: "Monthly calendar",
        body: "A full month planned ahead, visible in your portal calendar.",
      },
      {
        title: "Create & approve",
        body: "Approve or request changes on each post with one click.",
      },
      {
        title: "Publish & learn",
        body: "We publish, measure and feed the learnings into next month.",
      },
    ],
    idealFor: "Brands that know social matters but can't give it the time it needs.",
    faqs: [
      {
        q: "How many posts per month?",
        a: "Plans typically range from 12 to 30 posts and reels per month across both platforms.",
      },
      {
        q: "How do approvals work?",
        a: "Every post appears in your portal. Approve it, or request changes with a comment; we revise and resubmit.",
      },
      {
        q: "Do you reply to comments and DMs?",
        a: "Community management is available as an add-on with agreed response times.",
      },
    ],
  },
  {
    slug: "meta-ads",
    name: "Meta Ads",
    icon: "ads",
    headline: "Facebook and Instagram ads managed for return, not just reach.",
    summary:
      "Full-funnel Meta advertising: offer and audience strategy, creative testing, tracking and daily optimisation, with live performance in your client portal.",
    outcomes: [
      "Lower cost per lead or purchase through structured testing",
      "Clear ROAS and CPA reporting you can check any day",
      "Budgets scaled only when the numbers support it",
      "Accurate tracking with Pixel and Conversions API",
    ],
    deliverables: [
      "Account audit and funnel strategy",
      "Campaign structure, audiences and budgets",
      "Ad creative and copy testing roadmap",
      "Pixel, Conversions API and event setup",
      "Daily monitoring and weekly optimisation",
      "Live dashboard plus monthly PDF report",
    ],
    process: [
      {
        title: "Audit & tracking",
        body: "Fix measurement first so every decision is based on real data.",
      },
      {
        title: "Strategy",
        body: "Offers, audiences and a creative testing plan for each funnel stage.",
      },
      {
        title: "Launch & test",
        body: "Structured tests that find winners quickly without wasting budget.",
      },
      { title: "Scale & report", body: "Scale what works, with live numbers in your portal." },
    ],
    idealFor: "Businesses ready to put budget behind growth and want to see exactly where it goes.",
    faqs: [
      {
        q: "What budget do I need?",
        a: "We recommend starting from a test budget that allows meaningful data within 2–4 weeks; we'll size it with you.",
      },
      {
        q: "Who owns the ad account?",
        a: "You do. We work inside your Business Manager with partner access.",
      },
      {
        q: "How quickly will I see results?",
        a: "Early signals appear in the first weeks; stable performance usually takes one to two months of testing.",
      },
    ],
  },
];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}
