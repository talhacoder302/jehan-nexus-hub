import { JsonLd, organizationJsonLd } from "@/components/marketing/json-ld";
import { MotionProvider } from "@/components/marketing/motion";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <MotionProvider>
      {/* Scroll reveals start hidden; without JavaScript they would never appear. */}
      <noscript>
        <style>{`[style*="opacity:0"]{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <JsonLd data={organizationJsonLd()} />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </MotionProvider>
  );
}
