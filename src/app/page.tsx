"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n";
import { Banner, Nav, Footer } from "@/components/chrome";
import Explorer from "@/components/Explorer";
import Showcase from "@/components/Showcase";
import Developers from "@/components/Developers";

interface Summary {
  total_parcels: number;
  addresses_matched: number;
  stacked_parcels_ge10_addresses: number;
  sample_rows: number;
  methodology_notes: string[];
}

const num = (n: number) => n.toLocaleString("en-CA");

function Hero() {
  const { t } = useLang();
  const [s, setS] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/v1/parcel/summary")
      .then((r) => r.json())
      .then(setS)
      .catch(() => {});
  }, []);

  const values = s
    ? [num(s.total_parcels), num(s.addresses_matched), num(s.stacked_parcels_ge10_addresses), num(s.sample_rows)]
    : ["…", "…", "…", "…"];

  return (
    <section id="top" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 pb-16 pt-16 md:pb-24 md:pt-24">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.hero.kicker}</p>
        <h1 className="display mt-5 max-w-[880px] text-[52px] md:text-[84px]">{t.hero.title}</h1>
        <p className="mt-6 max-w-[680px] text-[19px] leading-relaxed text-ink/70 md:text-[21px]">{t.hero.sub}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href="#explorer" className="rounded-full bg-canada px-7 py-3.5 text-[16px] font-semibold text-white hover:bg-canada-dark">
            {t.hero.cta1}
          </a>
          <a href="#methodology" className="rounded-full border border-line px-7 py-3.5 text-[16px] font-semibold hover:border-ink">
            {t.hero.cta2}
          </a>
        </div>
        <div className="mt-16 grid gap-px overflow-hidden rounded-[24px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {t.hero.statsLabels.map((label, i) => (
            <div key={label} className="bg-paper p-7">
              <p className="display text-[44px] text-canada">{values[i]}</p>
              <p className="mt-2 text-[15px] leading-snug text-ink/65">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Methodology() {
  const { t } = useLang();
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/v1/parcel/summary")
      .then((r) => r.json())
      .then((d: Summary) => setNotes(d.methodology_notes ?? []))
      .catch(() => {});
  }, []);

  return (
    <section id="methodology" className="bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.methodology.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.methodology.title}</h2>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
            <h3 className="display text-[26px] leading-tight">{t.methodology.idTitle}</h3>
            <p className="mt-4 text-[16px] leading-relaxed text-ink/70">{t.methodology.idBody}</p>
          </article>
          <article className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
            <h3 className="display text-[26px] leading-tight">{t.methodology.areaTitle}</h3>
            <p className="mt-4 text-[16px] leading-relaxed text-ink/70">{t.methodology.areaBody}</p>
          </article>
        </div>

        <div className="mt-5 rounded-[24px] border border-line bg-paper p-6 md:p-8">
          <h3 className="display text-[26px] leading-tight">{t.methodology.notesTitle}</h3>
          <ul className="mt-5 space-y-3">
            {notes.map((n, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink/70">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-canada" />
                {n}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[14px] text-ink/55">{t.methodology.builtLine}</p>
        </div>
      </div>
    </section>
  );
}

function Downloads() {
  const { t } = useLang();
  const paths = ["/data/parcel_spine_sample.csv", "/data/summary.json"];
  return (
    <section id="data" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.downloads.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.downloads.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-ink/70">{t.downloads.body}</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {t.downloads.files.map((f, i) => (
            <div key={f.name} className="flex items-center justify-between gap-4 rounded-[24px] border border-line bg-paper-warm p-6">
              <div className="min-w-0">
                <code className="font-mono text-[15px] font-medium break-all">{f.name}</code>
                <p className="mt-1 text-[14px] text-ink/60">{f.desc}</p>
              </div>
              <a href={paths[i]} download className="shrink-0 rounded-full border border-line px-5 py-2.5 text-[15px] font-semibold hover:border-ink">
                {t.downloads.download}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Banner />
      <Nav />
      <main className="flex-1">
        <Hero />
        <Explorer />
        <Showcase />
        <Methodology />
        <Developers />
        <Downloads />
      </main>
      <Footer />
    </>
  );
}
