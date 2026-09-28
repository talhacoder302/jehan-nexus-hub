import { siteConfig } from "@/lib/site";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-brand-gradient text-4xl font-semibold">{siteConfig.name}</h1>
      <p className="max-w-md text-muted-foreground">{siteConfig.description}</p>
    </main>
  );
}
