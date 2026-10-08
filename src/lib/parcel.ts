import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "data");

export interface Parcel {
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

export interface Ward {
  code: string;
  name: string;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").trim().split("\n");
  const headers = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = splitLine(line);
    const o: Record<string, string> = {};
    headers.forEach((h, i) => (o[h] = vals[i] ?? ""));
    return o;
  });
}

function splitLine(line: string): string[] {
  const vals: string[] = [];
  let cur = "",
    inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (ch === "," && !inQ) {
      vals.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  vals.push(cur);
  return vals;
}

function toParcel(r: Record<string, string>): Parcel {
  const addrs = (r.addresses ?? "")
    .split(" | ")
    .map((a) => a.trim())
    .filter(Boolean);
  return {
    parcel_id: r.parcel_id ?? "",
    parcelid_src: r.parcelid_src ?? "",
    feature_type: r.feature_type ?? "",
    area_m2: parseFloat(r.area_m2) || 0,
    stated_area: r.stated_area ?? "",
    centroid_lat: parseFloat(r.centroid_lat) || 0,
    centroid_lng: parseFloat(r.centroid_lng) || 0,
    ward: r.ward ?? "",
    ward_name: r.ward_name ?? "",
    hood158_code: r.hood158_code ?? "",
    hood158_name: r.hood158_name ?? "",
    address_count: parseInt(r.address_count, 10) || 0,
    addresses: addrs,
    source_rows: parseInt(r.source_rows, 10) || 0,
    flag_stacked: r.flag_stacked === "1",
    lineage: r.lineage ?? "",
  };
}

interface ParcelCache {
  rows: Parcel[];
  byId: Map<string, Parcel>;
  wards: Ward[];
  summary: unknown;
}

let cache: ParcelCache | null = null;

export function getData(): ParcelCache {
  if (cache) return cache;
  const text = fs.readFileSync(path.join(DATA, "parcel_spine_sample.csv"), "utf8");
  const rows = parseCsv(text).map(toParcel);
  const byId = new Map<string, Parcel>();
  const wardMap = new Map<string, string>();
  for (const p of rows) {
    byId.set(p.parcel_id.toUpperCase(), p);
    if (p.ward && !wardMap.has(p.ward)) wardMap.set(p.ward, p.ward_name);
  }
  const wards: Ward[] = [...wardMap.entries()]
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  const summary = JSON.parse(fs.readFileSync(path.join(DATA, "summary.json"), "utf8"));
  cache = { rows, byId, wards, summary };
  return cache;
}

export function lookupParcel(id: string): Parcel | undefined {
  return getData().byId.get(id.trim().toUpperCase());
}

export interface SearchParams {
  q: string;
  ward: string;
  limit?: number;
}

export function searchParcels({ q, ward, limit = 50 }: SearchParams): { total: number; parcels: Parcel[] } {
  const { rows } = getData();
  const query = q.trim().toLowerCase();
  const out: Parcel[] = [];
  let total = 0;
  for (const p of rows) {
    if (ward && p.ward !== ward) continue;
    if (query) {
      const hay = `${p.parcel_id} ${p.parcelid_src} ${p.addresses.join(" ")} ${p.ward} ${p.ward_name}`.toLowerCase();
      if (!hay.includes(query)) continue;
    }
    total++;
    if (out.length < limit) out.push(p);
  }
  return { total, parcels: out };
}

export function parcelToJson(p: Parcel) {
  return { ...p };
}
