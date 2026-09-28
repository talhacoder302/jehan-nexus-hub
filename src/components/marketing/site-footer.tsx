import { Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { services } from "@/content/services";
import { siteConfig } from "@/lib/site";
import { FacebookIcon, InstagramIcon, LinkedinIcon } from "./social-icons";

const socials = [
  { href: siteConfig.socials.instagram, label: "Instagram", Icon: InstagramIcon },
  { href: siteConfig.socials.facebook, label: "Facebook", Icon: FacebookIcon },
  { href: siteConfig.socials.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <BrandLogo />
          <p className="mt-4 text-sm text-muted-foreground">{siteConfig.tagline}</p>
          <div className="mt-5 flex gap-2">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid size-9 place-items-center rounded-lg border text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <FooterColumn title="Services">
          {services.map((s) => (
            <FooterLink key={s.slug} href={`/services/${s.slug}`}>
              {s.name}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Company">
          <FooterLink href="/work">Work</FooterLink>
          <FooterLink href="/about">About</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
          <FooterLink href="/login">Client portal</FooterLink>
        </FooterColumn>

        <FooterColumn title="Contact">
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4" />
            <a href={`mailto:${siteConfig.email}`} className="hover:text-foreground">
              {siteConfig.email}
            </a>
          </li>
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {siteConfig.location}
          </li>
        </FooterColumn>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>
            © {year} {siteConfig.legalName}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}
