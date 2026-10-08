"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/i18n";

interface Ward {
  code: string;
  name: string;
}

interface ParcelRow {
  parcel_id: string;
  parcelid_src: string;
  feature_type: string;
  area_m2: number;
  stated_area: string;
  centroid_lat: number;
  centroid_lng: number;
  ward: string;
  ward_name: string;
  hood158_code: string;
  hood158_name: string;
  address_count: number;
  addresses: string[];
  source_rows: number;
  flag_stacked: boolean;
  lineage: string;
}

const fmtArea = (a: number) =>
  a >= 10000 ? `${(a / 10000).toFixed(2)} ha` : `${Math.round(a).toLocaleString("en-CA")} m²`;

export default function Explorer() {
  const { t } = useLang();
  const [wards, setWards] = useState<Ward[]>([]);
  const [query, setQuery] = useState("");
  const [ward, setWard] = useState("");
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<ParcelRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ParcelRow | null>(null);

  useEffect(() => {
    fetch("/api/v1/parcel/search?limit=1")
      .then((r) => r.json())
      .then((d) => setWards(d.wards ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    fetch(`/api/v1/parcel/lookup/${encodeURIComponent(selectedId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setDetail);
  }, [selectedId]);

  const runSearch = () => {
    setLoading(true);
    setSearched(true);
    setSelectedId(null);
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    if (ward) p.set("ward", ward);
    fetch(`/api/v1/parcel/search?${p.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setResults(d.parcels ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  };

  const clear = () => {
    setQuery("");
    setWard("");
    setResults([]);
    setTotal(0);
    setSearched(false);
    setSelectedId(null);
  };

  const wardLabel = useMemo(() => {
    const m = new Map(wards.map((w) => [w.code, w.name]));
    return (code: string) => (code ? `${m.get(code) ?? ""} ${code}`.trim() : "-");
  }, [wards]);

  const d = t.explorer.detail;

  return (
    <section id="explorer" className="bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.explorer.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.explorer.title}</h2>

        <div className="mt-10 overflow-hidden rounded-[24px] border border-line bg-paper">
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder={t.explorer.search}
              className="min-w-[240px] flex-1 rounded-full border border-line bg-paper-warm px-4 py-2.5 text-[15px] outline-none focus:border-canada"
            />
            <label className="flex items-center gap-2 text-[14px] text-ink/60">
              {t.explorer.wardFilter}
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="rounded-full border border-line bg-paper-warm px-3 py-2 text-[14px] text-ink outline-none focus:border-canada"
              >
                <option value="">{t.explorer.allWards}</option>
                {wards.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} · {w.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={runSearch}
              className="rounded-full bg-canada px-6 py-2.5 text-[15px] font-semibold text-white hover:bg-canada-dark"
            >
              {t.explorer.searchButton}
            </button>
            {searched && (
              <button
                onClick={clear}
                className="rounded-full border border-line px-5 py-2.5 text-[15px] font-medium text-ink/70 hover:border-ink hover:text-ink"
              >
                {t.explorer.clearButton}
              </button>
            )}
          </div>

          {!searched && (
            <p className="px-6 py-14 text-center text-[15px] leading-relaxed text-ink/55 md:px-24">{t.explorer.empty}</p>
          )}
          {searched && loading && (
            <p className="px-6 py-14 text-center text-[15px] text-ink/55">…</p>
          )}
          {searched && !loading && results.length === 0 && (
            <p className="px-6 py-14 text-center text-[15px] text-ink/55">{t.explorer.noResult}</p>
          )}
          {searched && !loading && results.length > 0 && (
            <>
              <p className="border-b border-line px-6 py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-ink/50">
                {total.toLocaleString("en-CA")} {t.explorer.colCount}
              </p>
              <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-[14px]">
                    <thead>
                      <tr className="border-b border-line text-[12px] uppercase tracking-[0.08em] text-ink/50">
                        <th className="px-5 py-3 font-semibold">{t.explorer.colId}</th>
                        <th className="px-5 py-3 font-semibold">{t.explorer.colAddr}</th>
                        <th className="px-5 py-3 font-semibold">{t.explorer.colWard}</th>
                        <th className="px-5 py-3 font-semibold">{t.explorer.colArea}</th>
                        <th className="px-5 py-3 font-semibold">{t.explorer.colCount}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((p) => (
                        <tr
                          key={p.parcel_id}
                          onClick={() => setSelectedId(p.parcel_id)}
                          className={`cursor-pointer border-b border-line/60 hover:bg-muted ${
                            selectedId === p.parcel_id ? "bg-muted" : ""
                          }`}
                        >
                          <td className="px-5 py-3 font-mono text-[13px] font-medium text-canada">{p.parcel_id}</td>
                          <td className="max-w-[280px] truncate px-5 py-3 text-ink/75">
                            {p.addresses.slice(0, 2).join("; ") || "-"}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-ink/75">{wardLabel(p.ward)}</td>
                          <td className="whitespace-nowrap px-5 py-3 text-ink/75">{fmtArea(p.area_m2)}</td>
                          <td className="px-5 py-3 text-ink/75">
                            {p.address_count}
                            {p.flag_stacked && (
                              <span className="ml-2 rounded-full bg-canada/10 px-2 py-0.5 text-[11px] font-semibold text-canada">
                                10+
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <aside className="border-t border-line p-6 lg:border-l lg:border-t-0">
                  {!detail && (
                    <p className="text-[14px] leading-relaxed text-ink/55">{t.explorer.hint}</p>
                  )}
                  {detail && (
                    <div>
                      <p className="font-mono text-[13px] font-medium text-canada">{detail.parcel_id}</p>
                      <h3 className="display mt-1 text-[26px] leading-tight">
                        {detail.addresses[0] ?? detail.ward_name}
                      </h3>
                      <div className="mt-6 space-y-4 text-[15px]">
                        <Field label={d.featureType} value={detail.feature_type || "-"} />
                        <Field label={d.area} value={`${detail.area_m2.toLocaleString("en-CA")} m²`} />
                        {detail.stated_area && detail.stated_area.toLowerCase() !== "unknown" && (
                          <Field label={d.statedArea} value={detail.stated_area} />
                        )}
                        <Field
                          label={d.centroid}
                          value={`${detail.centroid_lat.toFixed(6)}, ${detail.centroid_lng.toFixed(6)}`}
                          mono
                        />
                        <Field label={d.ward} value={`${detail.ward_name} (${detail.ward})`} />
                        {detail.hood158_name && (
                          <Field label={d.neighbourhood} value={`${detail.hood158_name} (${detail.hood158_code})`} />
                        )}
                        <Field label={d.sourceRows} value={String(detail.source_rows)} />
                        <div>
                          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink/50">{d.stacked}</p>
                          <p className="mt-1 flex items-center gap-2">
                            <span
                              className={`inline-block h-2.5 w-2.5 rounded-full ${detail.flag_stacked ? "bg-canada" : "bg-ink/25"}`}
                            />
                            {detail.flag_stacked ? d.stackedYes : d.stackedNo}
                          </p>
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink/50">
                            {d.addresses} ({detail.address_count})
                          </p>
                          <ul className="mt-2 max-h-[180px] space-y-1 overflow-y-auto text-[14px] text-ink/75">
                            {detail.addresses.map((a, i) => (
                              <li key={i}>{a}</li>
                            ))}
                            {detail.addresses.length === 0 && <li>-</li>}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink/50">{d.lineage}</p>
                          <p className="mt-1 break-all font-mono text-[12px] text-ink/60">{detail.lineage}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink/50">{label}</p>
      <p className={`mt-1 ${mono ? "font-mono text-[13px]" : ""}`}>{value}</p>
    </div>
  );
}
