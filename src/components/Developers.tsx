"use client";

import { useLang } from "@/i18n";
import McpConnect from "./McpConnect";

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/parcel/search?q=Queen+St+W&ward=10",
    desc: "Search by address text or parcel ID, filtered to one ward",
    response: `{
  "query": "Queen St W",
  "ward": "10",
  "total": 65,
  "parcels": [
    { "parcel_id": "TOP-10572318", "ward": "10",
      "address_count": 3, "area_m2": 292.8, … }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/v1/parcel/lookup/TOP-10572318",
    desc: "Full record: lineage, addresses, stacked flag",
    response: `{
  "parcel_id": "TOP-10572318",
  "feature_type": "CONDO",
  "area_m2": 292.8,
  "ward": "10",
  "hood158_name": "Kensington-Chinatown",
  "address_count": 3,
  "source_rows": 1,
  "flag_stacked": false,
  "lineage": "property-boundaries:526006"
}`,
  },
  {
    method: "GET",
    path: "/api/v1/parcel/summary",
    desc: "Full-build totals, breakdowns, and methodology notes",
    response: `{ "total_parcels": 498477,
  "addresses_matched": 525085,
  "stacked_parcels_ge10_addresses": 947,
  "size_buckets_m2": { … }, … }`,
  },
];

export default function Developers() {
  const { t } = useLang();
  return (
    <section id="developers" className="bg-ink text-white">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.developers.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-white/70">{t.developers.body}</p>

        <h3 className="mt-14 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.endpoints}</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {endpoints.map((e) => (
            <article key={e.path} className="overflow-hidden rounded-[24px] bg-white/[0.06]">
              <div className="border-b border-white/10 px-6 py-4">
                <span className="mr-3 rounded-full bg-canada px-2.5 py-1 font-mono text-[12px] font-semibold">{e.method}</span>
                <code className="font-mono text-[13px] text-white/85 break-all">{e.path}</code>
                <p className="mt-2 text-[14px] text-white/60">{e.desc}</p>
                <a
                  href={e.path}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block rounded-full border border-white/25 px-4 py-1.5 text-[13px] font-semibold text-white/85 hover:border-white/60"
                >
                  {t.developers.tryIt} →
                </a>
              </div>
              <pre className="overflow-x-auto px-6 py-4 font-mono text-[12.5px] leading-relaxed text-white/75">{e.response}</pre>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <a href="/api/openapi.json" className="block rounded-[24px] bg-white/[0.06] p-6 hover:bg-white/[0.09]">
            <h4 className="text-[19px] font-semibold">{t.developers.openapi}</h4>
            <code className="mt-2 block font-mono text-[13px] text-white/60">GET /api/openapi.json</code>
          </a>
        </div>

        <McpConnect
          config={{
            slug: "toronto-parcel",
            displayName: "Toronto Parcel Spine",
            exampleEn: "Look up the parcel at 136 Monarch Park Ave",
            exampleFr: "Recherche la parcelle au 136 Monarch Park Ave",
          }}
        />
      </div>
    </section>
  );
}
