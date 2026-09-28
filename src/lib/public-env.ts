/**
 * Browser-safe configuration. Each NEXT_PUBLIC_ variable is referenced literally so Next.js can
 * inline it at build time. Kept separate from `env.ts` so the server schema never ships to clients.
 */
export const publicEnv = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  pusherKey: process.env.NEXT_PUBLIC_PUSHER_KEY || undefined,
  pusherCluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || undefined,
} as const;
