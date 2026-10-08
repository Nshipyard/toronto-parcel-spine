"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n";

interface Summary {
  total_parcels: number;
  addresses_total: number;
  addresses_matched: number;
  stacked_parcels_ge10_addresses: number;
  size_buckets_m2: Record<string, number>;
  top_wards_by_parcels: [string, number][];
}

interface Ward {
  code: string;
  name: string;
}

const num = (n: number) => n.toLocaleString("en-CA");

function Card({ children }: { children: React.ReactNode }) {
  return (
    <article className="rounded-[24px] border border-line bg-paper p-6 md:p-8">{children}</article>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="display text-[26px] leading-tight">{children}</h3>;
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[15px] leading-relaxed text-ink/65">{children}</p>;
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-canada" style={{ width: `${Math.min(100, Math.max(0, pct)).toFixed(1)}%` }} />
    </div>
  );
}

export default function Showcase() {
  const { t } = useLang();
  const [s, setS] = useState<Summary | null>(null);
  const [wardNames, setWardNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetch("/api/v1/parcel/summary")
      .then((r) => r.json())
      .then(setS)
      .catch(() => {});
    fetch("/api/v1/parcel/search?limit=1")
      .then((r) => r.json())
      .then((d) => setWardNames(new Map((d.wards ?? []).map((w: Ward) => [w.code, w.name]))))
      .catch(() => {});
  }, []);

  if (!s) {
    return (
      <section id="showcase" className="bg-paper">
        <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.showcase.kicker}</p>
          <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.showcase.title}</h2>
          <p className="mt-12 text-ink/40">…</p>
        </div>
      </section>
    );
  }

  const stackedShare = (s.stacked_parcels_ge10_addresses / s.total_parcels) * 100;
  const matchRate = (s.addresses_matched / s.addresses_total) * 100;
  const buckets = Object.entries(s.size_buckets_m2);
  const maxBucket = Math.max(...buckets.map(([, v]) => v));

  return (
    <section id="showcase" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.showcase.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.showcase.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-ink/70">{t.showcase.body}</p>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Card>
            <CardTitle>{t.showcase.sizeTitle}</CardTitle>
            <CardBody>{t.showcase.sizeBody}</CardBody>
            <div className="mt-6 space-y-4">
              {buckets.map(([label, count]) => (
                <div key={label}>
                  <div className="flex items-baseline justify-between gap-2 text-[14px]">
                    <span className="font-mono font-medium">{label}</span>
                    <span className="text-ink/60">
                      {num(count)} · {((count / s.total_parcels) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Bar pct={(count / maxBucket) * 100} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>{t.showcase.stackedTitle}</CardTitle>
            <CardBody>{t.showcase.stackedBody}</CardBody>
            <p className="display mt-6 text-[56px] text-canada">{num(s.stacked_parcels_ge10_addresses)}</p>
            <p className="mt-1 text-[15px] text-ink/60">
              {stackedShare.toFixed(2)}% {t.showcase.stackedShareLine}
            </p>
            <div className="mt-5">
              <Bar pct={stackedShare} />
            </div>
            <p className="mt-2 text-[13px] text-ink/55">
              {num(s.total_parcels - s.stacked_parcels_ge10_addresses)} {t.showcase.restLine}
            </p>
          </Card>

          <Card>
            <CardTitle>{t.showcase.wardsTitle}</CardTitle>
            <CardBody>{t.showcase.wardsBody}</CardBody>
            <ol className="mt-6 space-y-3">
              {s.top_wards_by_parcels.map(([code, count], i) => {
                const top = s.top_wards_by_parcels[0][1];
                return (
                  <li key={code} className="flex items-center gap-3">
                    <span className="display w-8 shrink-0 text-[20px] text-ink/40">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2 text-[14px]">
                        <span className="truncate font-medium">
                          {wardNames.get(code) ?? ""} <span className="font-mono text-ink/50">{code}</span>
                        </span>
                        <span className="shrink-0 text-ink/60">{num(count)}</span>
                      </div>
                      <div className="mt-1">
                        <Bar pct={(count / top) * 100} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card>
            <CardTitle>{t.showcase.matchTitle}</CardTitle>
            <CardBody>{t.showcase.matchBody}</CardBody>
            <p className="display mt-6 text-[56px] text-canada">{matchRate.toFixed(1)}%</p>
            <p className="mt-1 text-[15px] text-ink/60">
              {num(s.addresses_matched)} / {num(s.addresses_total)}
            </p>
            <div className="mt-5">
              <Bar pct={matchRate} />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
