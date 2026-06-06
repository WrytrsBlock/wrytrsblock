import type { ReactNode } from "react";

// Shared, professional formatting for the legal pages (Terms, Privacy,
// Community Guidelines). Server-rendered, no interactivity.

export function LegalPage({
  category,
  title,
  intro,
  updated,
  children,
}: {
  category: string;
  title: string;
  intro: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="animate-fade-up">
      <header className="border-b border-line pb-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          {category}
        </p>
        <h1 className="mt-2 font-display text-3xl md:text-5xl text-ink tracking-tight leading-[1.05]">
          {title}
        </h1>
        <p className="mt-3 text-[14px] md:text-[15px] text-ink/70 leading-relaxed max-w-2xl">
          {intro}
        </p>
        <p className="mt-4 text-[12px] text-muted">Last updated: {updated}</p>
      </header>

      <div className="mt-8 space-y-9">{children}</div>
    </article>
  );
}

export function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="scroll-mt-24">
      <h2 className="font-display text-[19px] md:text-[22px] text-ink tracking-tight">
        <span className="text-muted/70 tabular-nums mr-2">{n}.</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3.5">{children}</div>
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="text-[14px] text-ink/80 leading-[1.75]">{children}</p>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5 text-[14px] text-ink/80 leading-[1.7]">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

// Inline emphasis for WrytrsBlock terms (Blocks, Service Blocks, etc.).
export function Term({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-ink">{children}</span>;
}
