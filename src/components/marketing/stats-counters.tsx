"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { stats } from "@/content/home";

function Counter({
  value,
  decimals = 0,
  suffix,
}: {
  value: number;
  decimals?: number;
  suffix: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView || reduce) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => {
        node.textContent = `${v.toFixed(decimals)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, reduce, value, decimals, suffix]);

  // Server-rendered with the final value so crawlers and no-JS users see real numbers.
  return (
    <span ref={ref} className="tabular-nums">
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function StatsCounters() {
  return (
    <section aria-label="Results" className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <dl className="grid grid-cols-2 gap-6 rounded-3xl border bg-card p-8 sm:p-10 lg:grid-cols-4">
          {stats.items.map((s) => (
            <div key={s.label} className="text-center">
              <dd className="text-brand-gradient font-heading text-4xl font-semibold sm:text-5xl">
                <Counter value={s.value} decimals={s.decimals} suffix={s.suffix} />
              </dd>
              <dt className="mt-2 text-sm text-muted-foreground">{s.label}</dt>
            </div>
          ))}
        </dl>
        {stats.placeholder ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Figures shown are targets and placeholders to be replaced with verified results.
          </p>
        ) : null}
      </div>
    </section>
  );
}
