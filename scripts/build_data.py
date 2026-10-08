#!/usr/bin/env python3
"""Build the Toronto parcel spine from City of Toronto open data.

Sources (retrieved 2026-10-08, City of Toronto Open Data Portal, open.toronto.ca):
  - Property Boundaries (datastore resource 4270614e-0b5e-4b54-a2bb-18ef92237646)
  - Address Points, Toronto One Address Repository
    (datastore resource 0b3756af-9caf-4f0f-ac28-9c6617adede4)

Outputs:
  - data/parcel_spine.csv        full spine, one row per PARCELID (NOT committed: ~70MB)
  - data/parcel_spine_sample.csv 25,000-row stratified sample (committed, powers the app)
  - data/summary.json            counts and breakdowns (committed)

Spine ID scheme: TOP-<PARCELID>, where TOP = Toronto Open Parcel and PARCELID
is the city's own integer parcel key from Property Boundaries. The ID is stable
as long as the city keeps PARCELID stable across vintages; if the city renumbers
a parcel, the TOP id changes with it (documented limitation, not a flaw we can fix).
"""

from __future__ import annotations

import csv
import json
import math
import os
import sys
import urllib.request
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
RAW = os.path.join(DATA, "raw")
os.makedirs(RAW, exist_ok=True)

CKAN = "https://ckan0.cf.opendata.inter.prod-toronto.ca"
PB_RES = "4270614e-0b5e-4b54-a2bb-18ef92237646"
AP_RES = "0b3756af-9caf-4f0f-ac28-9c6617adede4"
PAGE = 32000

# Equirectangular projection centred on Toronto for approximate areas (documented).
LAT0 = 43.7
KX = 111320.0 * math.cos(math.radians(LAT0))
KY = 111132.0

GEO1 = "/home/hatch/workspace/toronto-geo-concordances/data/raw"


def fetch_all(resource_id, fields):
    """Yield records from the CKAN datastore, paging with limit/offset."""
    offset = 0
    total = None
    n = 0
    while True:
        url = (f"{CKAN}/api/3/action/datastore_search?resource_id={resource_id}"
               f"&limit={PAGE}&offset={offset}&fields={','.join(fields)}")
        with urllib.request.urlopen(url, timeout=120) as resp:
            d = json.load(resp)
        res = d["result"]
        if total is None:
            total = res["total"]
            print(f"  total records: {total}", flush=True)
        recs = res["records"]
        if not recs:
            break
        for r in recs:
            yield r
            n += 1
        offset += len(recs)
        if n % 128000 < PAGE:
            print(f"  fetched {n}/{total}", flush=True)
        if offset >= total:
            break


def parse_rings(geom_text):
    """Return list of outer rings as lists of (x, y). Handles Polygon/MultiPolygon."""
    try:
        g = json.loads(geom_text)
    except Exception:
        return []
    t = g.get("type")
    coords = g.get("coordinates", [])
    if t == "Polygon":
        return [coords[0]] if coords else []
    if t == "MultiPolygon":
        return [p[0] for p in coords if p]
    return []


def ring_area_centroid(ring):
    """Shoelace area (m^2, projected) and centroid of one ring."""
    sx = sy = a2 = cx = cy = 0.0
    n = len(ring)
    if n < 3:
        return 0.0, 0.0, 0.0
    for i in range(n):
        x1 = ring[i][0] * KX
        y1 = ring[i][1] * KY
        x2 = ring[(i + 1) % n][0] * KX
        y2 = ring[(i + 1) % n][1] * KY
        c = x1 * y2 - x2 * y1
        a2 += c
        cx += (x1 + x2) * c
        cy += (y1 + y2) * c
    area = abs(a2) / 2.0
    if a2 == 0:
        xs = [p[0] for p in ring]
        ys = [p[1] for p in ring]
        return 0.0, sum(xs) / n, sum(ys) / n
    return area, cx / (3 * a2), cy / (3 * a2)  # projected centroid


def point_in_ring(px, py, ring):
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi + 1e-18) + xi:
            inside = not inside
        j = i
    return inside


def load_zone_polys(path, code_key, name_key):
    gj = json.load(open(path))
    polys = []
    for f in gj["features"]:
        g = f["geometry"]
        if not g:
            continue
        coords = g["coordinates"]
        rings = [coords[0]] if g["type"] == "Polygon" else [p[0] for p in coords]
        xs = [p[0] for r in rings for p in r]
        ys = [p[1] for r in rings for p in r]
        polys.append({
            "code": str(f["properties"].get(code_key, "")),
            "name": str(f["properties"].get(name_key, "")),
            "rings": rings,
            "bbox": (min(xs), min(ys), max(xs), max(ys)),
        })
    return polys


def locate(px, py, polys):
    for p in polys:
        x0, y0, x1, y1 = p["bbox"]
        if not (x0 <= px <= x1 and y0 <= py <= y1):
            continue
        for ring in p["rings"]:
            if point_in_ring(px, py, ring):
                return p["code"], p["name"]
    return "", ""


def main():
    print("Pass 1: property boundaries", flush=True)
    parcels = {}  # PARCELID -> aggregate dict
    ftype_counter = Counter()
    for r in fetch_all(PB_RES, ["PARCELID", "FEATURE_TYPE", "STATEDAREA", "OBJECTID", "geometry"]):
        pid = r.get("PARCELID")
        if pid is None:
            continue
        pid = int(pid)
        ft = (r.get("FEATURE_TYPE") or "").strip()
        ftype_counter[ft] += 1
        rings = parse_rings(r.get("geometry") or "")
        if not rings:
            continue
        tot_area = 0.0
        wcx = wcy = 0.0  # projected centroid accumulator
        clat = clng = 0.0
        xs_all, ys_all = [], []
        for ring in rings:
            a, pcx, pcy = ring_area_centroid(ring)
            tot_area += a
            wcx += pcx * a
            wcy += pcy * a
            xs_all.extend(p[0] for p in ring)
            ys_all.extend(p[1] for p in ring)
        if tot_area > 0:
            clng = (wcx / tot_area) / KX
            clat = (wcy / tot_area) / KY
        else:
            clng = sum(xs_all) / len(xs_all)
            clat = sum(ys_all) / len(ys_all)
        agg = parcels.get(pid)
        if agg is None:
            agg = parcels[pid] = {
                "parcelid": pid, "feature_types": Counter(), "stated_areas": [],
                "area_m2": 0.0, "rings": [], "source_rows": 0, "objectids": [],
                "clat": 0.0, "clng": 0.0, "_wsum": 0.0,
            }
        agg["feature_types"][ft] += 1
        sa = (r.get("STATEDAREA") or "").strip()
        if sa:
            agg["stated_areas"].append(sa)
        agg["area_m2"] += tot_area
        agg["rings"].extend(rings)
        agg["source_rows"] += 1
        agg["objectids"].append(str(r.get("OBJECTID") or ""))
        # area-weighted centroid across parts
        prev_w = agg["_wsum"]
        new_w = prev_w + tot_area
        if new_w > 0:
            agg["clat"] = (agg["clat"] * prev_w + clat * tot_area) / new_w
            agg["clng"] = (agg["clng"] * prev_w + clng * tot_area) / new_w
        agg["_wsum"] = new_w
    print(f"  unique PARCELIDs: {len(parcels)}", flush=True)
    print("  feature types:", dict(ftype_counter.most_common()), flush=True)

    # Grid index over parcel bboxes for the address join
    print("Building grid index", flush=True)
    CELL = 0.005
    grid = defaultdict(list)
    bboxes = {}
    for pid, agg in parcels.items():
        xs = [p[0] for r in agg["rings"] for p in r]
        ys = [p[1] for r in agg["rings"] for p in r]
        if not xs:
            continue
        bb = (min(xs), min(ys), max(xs), max(ys))
        bboxes[pid] = bb
        for cx in range(int(bb[0] / CELL), int(bb[2] / CELL) + 1):
            for cy in range(int(bb[1] / CELL), int(bb[3] / CELL) + 1):
                grid[(cx, cy)].append(pid)
    print(f"  grid cells: {len(grid)}", flush=True)

    print("Pass 2: address points", flush=True)
    addr_count = defaultdict(int)
    addr_samples = defaultdict(list)
    addr_wards = defaultdict(Counter)
    matched = 0
    total_ap = 0
    for r in fetch_all(AP_RES, ["ADDRESS_FULL", "WARD", "WARD_NAME", "geometry"]):
        total_ap += 1
        gt = r.get("geometry") or ""
        try:
            pt = json.loads(gt)["coordinates"]
        except Exception:
            continue
        px, py = pt[0], pt[1]
        cell = (int(px / CELL), int(py / CELL))
        found = None
        for pid in grid.get(cell, []):
            x0, y0, x1, y1 = bboxes[pid]
            if not (x0 <= px <= x1 and y0 <= py <= y1):
                continue
            for ring in parcels[pid]["rings"]:
                if point_in_ring(px, py, ring):
                    found = pid
                    break
            if found is not None:
                break
        if found is None:
            continue
        matched += 1
        addr_count[found] += 1
        if len(addr_samples[found]) < 5:
            af = (r.get("ADDRESS_FULL") or "").strip()
            if af:
                addr_samples[found].append(af)
        w = (r.get("WARD") or "").strip()
        if w:
            addr_wards[found][w] += 1
        if total_ap % 200000 < PAGE and total_ap > 0:
            print(f"  addresses processed: {total_ap}, matched: {matched}", flush=True)
    print(f"  addresses: {total_ap}, matched to parcels: {matched}", flush=True)

    print("Pass 3: ward + neighbourhood lookup", flush=True)
    wards = load_zone_polys(os.path.join(GEO1, "wards25.geojson"), "AREA_LONG_CODE", "AREA_NAME")
    hoods = load_zone_polys(os.path.join(GEO1, "nbh158.geojson"), "AREA_LONG_CODE", "AREA_NAME")
    ward_names = {}
    for r in fetch_all(AP_RES, ["WARD", "WARD_NAME"]):
        w = (r.get("WARD") or "").strip()
        wn = (r.get("WARD_NAME") or "").strip()
        if w and wn and w not in ward_names:
            ward_names[w] = wn
    print(f"  ward names known: {len(ward_names)}", flush=True)

    rows = []
    stacked = 0
    no_addr = 0
    hood_counter = Counter()
    ward_counter = Counter()
    size_buckets = Counter()
    for pid, agg in parcels.items():
        n_addr = addr_count.get(pid, 0)
        if n_addr == 0:
            no_addr += 1
        is_stacked = n_addr >= 10
        if is_stacked:
            stacked += 1
        wc = addr_wards.get(pid)
        ward = wc.most_common(1)[0][0] if wc else ""
        if not ward:
            ward, _wn = locate(agg["clng"], agg["clat"], wards)
        ward_name = ward_names.get(ward, "")
        hcode, hname = locate(agg["clng"], agg["clat"], hoods)
        if hcode:
            hood_counter[hcode] += 1
        if ward:
            ward_counter[ward] += 1
        a = agg["area_m2"]
        if a < 200:
            size_buckets["<200 m2"] += 1
        elif a < 500:
            size_buckets["200-500 m2"] += 1
        elif a < 2000:
            size_buckets["500-2000 m2"] += 1
        elif a < 10000:
            size_buckets["2000-10000 m2"] += 1
        else:
            size_buckets[">10000 m2"] += 1
        ft = agg["feature_types"].most_common(1)[0][0]
        rows.append({
            "parcel_id": f"TOP-{pid}",
            "parcelid_src": pid,
            "feature_type": ft,
            "area_m2": round(a, 1),
            "stated_area": agg["stated_areas"][0] if agg["stated_areas"] else "",
            "centroid_lat": round(agg["clat"], 6),
            "centroid_lng": round(agg["clng"], 6),
            "ward": ward,
            "ward_name": ward_name,
            "hood158_code": hcode,
            "hood158_name": hname,
            "address_count": n_addr,
            "addresses": " | ".join(addr_samples.get(pid, [])),
            "source_rows": agg["source_rows"],
            "flag_stacked": 1 if is_stacked else 0,
            "lineage": "property-boundaries:" + ",".join(agg["objectids"][:8]),
        })

    cols = ["parcel_id", "parcelid_src", "feature_type", "area_m2", "stated_area",
            "centroid_lat", "centroid_lng", "ward", "ward_name", "hood158_code",
            "hood158_name", "address_count", "addresses", "source_rows",
            "flag_stacked", "lineage"]
    full_path = os.path.join(DATA, "parcel_spine.csv")
    with open(full_path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)
    print(f"  wrote {full_path} ({len(rows)} rows)", flush=True)

    # Stratified sample: 1000 per ward (25 wards) -> 25,000 rows
    by_ward = defaultdict(list)
    for r in rows:
        by_ward[r["ward"] or "??"].append(r)
    import random
    random.seed(42)
    sample = []
    for wcode in sorted(by_ward):
        pool = by_ward[wcode]
        random.shuffle(pool)
        sample.extend(pool[:1000])
    random.shuffle(sample)
    sample_path = os.path.join(DATA, "parcel_spine_sample.csv")
    with open(sample_path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        w.writerows(sample)
    print(f"  wrote {sample_path} ({len(sample)} rows)", flush=True)

    summary = {
        "generated": "2026-10-08",
        "sources": {
            "property_boundaries": "City of Toronto Open Data, Property Boundaries",
            "address_points": "City of Toronto Open Data, Address Points (Toronto One Address Repository)",
        },
        "id_scheme": "TOP-<PARCELID>: Toronto Open Parcel + the city's integer PARCELID",
        "total_parcels": len(rows),
        "total_source_rows": sum(r["source_rows"] for r in rows),
        "multi_row_parcels": sum(1 for r in rows if r["source_rows"] > 1),
        "parcels_with_addresses": sum(1 for r in rows if r["address_count"] > 0),
        "parcels_without_addresses": no_addr,
        "addresses_total": total_ap,
        "addresses_matched": matched,
        "stacked_parcels_ge10_addresses": stacked,
        "parcels_with_ward": sum(1 for r in rows if r["ward"]),
        "parcels_with_neighbourhood": sum(1 for r in rows if r["hood158_code"]),
        "feature_types": dict(ftype_counter.most_common()),
        "size_buckets_m2": dict(size_buckets),
        "top_wards_by_parcels": [[k, v] for k, v in ward_counter.most_common(10)],
        "sample_rows": len(sample),
        "methodology_notes": [
            "One spine row per unique PARCELID in Property Boundaries; repeated PARCELIDs (multi-part geometries) are merged, source_rows counts the parts.",
            "Areas are approximate, computed with an equirectangular projection centred on Toronto; stated_area is the city's own figure when present.",
            "Addresses join parcels by point-in-polygon; ward comes from the address record when present, else from the parcel centroid.",
            "flag_stacked marks parcels with 10+ addresses (condos, stacked units sharing one legal parcel).",
            "The full parcel_spine.csv is not committed (size); parcel_spine_sample.csv is a 25,000-row stratified sample, 1,000 per ward.",
        ],
    }
    with open(os.path.join(DATA, "summary.json"), "w", encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2)
    print("  wrote summary.json", flush=True)
    print(json.dumps({k: summary[k] for k in
          ["total_parcels", "parcels_with_addresses", "addresses_matched",
           "stacked_parcels_ge10_addresses", "parcels_with_ward",
           "parcels_with_neighbourhood"]}, indent=2))


if __name__ == "__main__":
    main()
