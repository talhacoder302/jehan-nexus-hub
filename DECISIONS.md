# Decisions

Choices made where the brief was ambiguous or the tooling differed from what it assumed. Newest at the bottom.

1. **Next.js 16 conventions.** The latest stable Next.js (16.3) renames `middleware.ts` to `proxy.ts` (Node.js runtime). Route protection lives in `src/proxy.ts`; everything the brief says about `middleware.ts` applies to that file.
2. **Tailwind v4 has no `tailwind.config`.** The brand accent is configured with CSS variables in `src/app/globals.css` (`--brand-from`, `--brand-to`). Changing those two values re-skins primary buttons, rings, gradients and chart colors.
3. **shadcn/ui v4 `form` → `field`.** The current shadcn registry replaced the `form` component with `field`. Forms use React Hook Form's `Controller` with `Field`, `FieldLabel` and `FieldError`.
4. **FullCalendar v7.** Plugins (daygrid, timegrid, interaction) ship inside `@fullcalendar/react` as subpath imports and need `temporal-polyfill`. The separate v6 plugin packages are not used.
5. **Auth.js v5 is still published as `next-auth@beta`** (5.0.0-beta.32). It's pinned to an exact version.
6. **Local MongoDB for development.** The MongoDB Atlas MCP connector is disabled for the Atlas organization and has no write tools, so development and seeding use a local `mongod`. Production uses an Atlas URI supplied before deployment. The database name is always `jehan_nexus_hub` (set through the Mongoose `dbName` option), whatever the URI path.
7. **pnpm 12 build-script allowlist.** `pnpm-workspace.yaml` allows `esbuild` install scripts (needed by `tsx` and Vitest). `sharp` stays disabled because Vercel provides image optimization.
8. **Dark-first theme.** `next-themes` defaults to dark, with a light-mode toggle. System preference is not followed, so the brand look stays consistent.
9. **Fonts.** Geist (body) and Sora (headings) via `next/font`, both self-hosted at build time.
