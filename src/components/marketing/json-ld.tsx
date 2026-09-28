import { publicEnv } from "@/lib/public-env";
import { siteConfig } from "@/lib/site";

/** Renders a JSON-LD script. `<` is escaped so content can never break out of the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: publicEnv.siteUrl,
    logo: `${publicEnv.siteUrl}/icon.svg`,
    description: siteConfig.description,
    email: siteConfig.email,
    sameAs: Object.values(siteConfig.socials),
    knowsAbout: [
      "Web Development",
      "Social Media Management",
      "Meta Ads",
      "Facebook Ads",
      "Instagram Ads",
    ],
  };
}
