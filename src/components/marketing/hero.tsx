"use client";

import { m, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarCheck, ChartLine, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Entrance fades use CSS animations (not Framer Motion) so above-the-fold content is visible even
 * before hydration and without JavaScript, which keeps LCP fast. `motion-reduce` disables them.
 */
const enter =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 fill-mode-both";
const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <m.div
          className="absolute -top-48 left-1/2 h-[36rem] w-[64rem] -translate-x-1/2 rounded-full bg-brand-gradient opacity-25 blur-3xl"
          animate={reduce ? undefined : { scale: [1, 1.08, 1], opacity: [0.22, 0.3, 0.22] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_top,black_30%,transparent_70%)] bg-size-[56px_56px] opacity-40" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-20 pb-24 text-center sm:px-6 sm:pt-28 sm:pb-32">
        <div
          className={`${enter} mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur`}
        >
          <Sparkles className="size-4 text-primary" />
          Web · Social · Meta Ads, with a live client portal
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl leading-[1.08] font-semibold text-balance sm:text-6xl">
          Marketing that grows your business,{" "}
          <span className="text-brand-gradient">and proves it.</span>
        </h1>

        <p
          style={delay(100)}
          className={`${enter} mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl`}
        >
          Jehan Nexus builds high-converting websites, runs your social media and manages Meta Ads
          for measurable return. You approve every post and see every result in your own client
          portal.
        </p>

        <div
          style={delay(200)}
          className={`${enter} mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row`}
        >
          <Button
            asChild
            size="lg"
            className="h-12 bg-brand-gradient px-6 text-base text-white shadow-lg shadow-primary/25"
          >
            <Link href="/contact">
              Get a Free Strategy Call
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
            <Link href="/work">See Our Work</Link>
          </Button>
        </div>

        <ul
          style={delay(300)}
          className={`${enter} mx-auto mt-12 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground`}
        >
          <li className="flex items-center gap-2">
            <CalendarCheck className="size-4 text-primary" /> Approve posts in one click
          </li>
          <li className="flex items-center gap-2">
            <ChartLine className="size-4 text-primary" /> Live Meta Ads dashboard
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> Monthly PDF reports
          </li>
        </ul>
      </div>
    </section>
  );
}
