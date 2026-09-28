import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Jehan Nexus collects, uses and protects personal data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="September 2026"
      intro={`This policy explains how ${siteConfig.legalName} ("we", "us") collects and uses personal data when you visit our website, contact us, or use the Jehan Nexus client portal.`}
      sections={[
        {
          heading: "Information we collect",
          paragraphs: [
            "Contact form: your name, email, and optionally phone number, company, service interest, budget range and message.",
            "Client portal: account details (name, email, role), activity such as approvals and comments, and content you upload or review.",
            "Advertising data: for clients who connect Meta ad accounts, we store campaign-level performance metrics (for example spend, impressions, clicks and conversions). We do not store personal data about people who see your ads.",
            "Technical data: essential cookies to keep you signed in, and standard server logs. To rate-limit spam we store a one-way hash of your IP address with contact form submissions, never the address itself.",
          ],
        },
        {
          heading: "How we use it",
          paragraphs: [
            "To respond to enquiries, provide our services, operate the client portal, send transactional emails (such as invites, approval requests and monthly reports), keep the service secure, and meet legal obligations.",
            "We do not sell personal data and do not use it for advertising profiles.",
          ],
        },
        {
          heading: "Service providers",
          paragraphs: [
            "We use trusted providers to run the service: hosting (Vercel), database (MongoDB Atlas), file storage (Amazon Web Services), email delivery (Resend), real-time notifications (Pusher), sign-in (Google, if you choose it) and advertising data (Meta). They process data on our behalf under their own security and privacy commitments.",
          ],
        },
        {
          heading: "Retention",
          paragraphs: [
            "Enquiries are kept for up to 24 months. Portal data is kept for the duration of our engagement and deleted or returned on request when it ends. In-app notifications are deleted automatically after 90 days.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            `Depending on where you live, you may have the right to access, correct, delete or export your personal data, and to object to or restrict certain processing. Email ${siteConfig.email} and we'll respond within 30 days.`,
          ],
        },
        {
          heading: "Contact",
          paragraphs: [`Questions about this policy: ${siteConfig.email}.`],
        },
      ]}
    />
  );
}
