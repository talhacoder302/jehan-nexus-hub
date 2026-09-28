import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms that apply to the Jehan Nexus website and client portal.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="September 2026"
      intro={`These terms govern your use of the ${siteConfig.name} website and client portal. Services themselves are provided under the proposal or agreement signed with each client, which takes precedence where the two differ.`}
      sections={[
        {
          heading: "Using the website",
          paragraphs: [
            "You may browse the website and contact us for legitimate business enquiries. Don't misuse the site, attempt to break its security, or submit spam through the contact form.",
          ],
        },
        {
          heading: "Client portal accounts",
          paragraphs: [
            "Portal access is by invitation. You're responsible for keeping your credentials secure and for activity under your account. Tell us promptly if you suspect unauthorised access.",
            "Approvals given in the portal are treated as your confirmation that content may be published as shown.",
          ],
        },
        {
          heading: "Content and ownership",
          paragraphs: [
            "You keep ownership of materials you provide. Deliverables transfer to you as set out in your agreement once paid. Performance data shown in the portal comes from third-party platforms and may be revised by those platforms.",
          ],
        },
        {
          heading: "Availability and liability",
          paragraphs: [
            'We aim to keep the portal available and accurate but provide it "as is" without guarantees of uninterrupted service. To the extent permitted by law, our liability is limited as set out in your service agreement.',
          ],
        },
        {
          heading: "Changes",
          paragraphs: [
            "We may update these terms from time to time. Material changes will be communicated to portal users by email.",
          ],
        },
        {
          heading: "Contact",
          paragraphs: [`Questions about these terms: ${siteConfig.email}.`],
        },
      ]}
    />
  );
}
