import type { MetadataRoute } from "next";
import { caseStudies } from "@/content/case-studies";
import { services } from "@/content/services";
import { publicEnv } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicEnv.siteUrl;
  const lastModified = new Date();
  const staticRoutes = ["", "/services", "/work", "/about", "/contact", "/privacy", "/terms"];
  return [
    ...staticRoutes.map((path) => ({
      url: `${base}${path}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : path === "/privacy" || path === "/terms" ? 0.3 : 0.8,
    })),
    ...services.map((s) => ({
      url: `${base}/services/${s.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...caseStudies.map((c) => ({
      url: `${base}/work/${c.slug}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
