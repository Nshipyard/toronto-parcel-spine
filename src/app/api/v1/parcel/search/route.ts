import { NextResponse } from "next/server";
import { searchParcels, getData, parcelToJson } from "@/lib/parcel";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const ward = url.searchParams.get("ward") ?? "";
  const rawLimit = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const limit = Math.min(Math.max(isNaN(rawLimit) ? 50 : rawLimit, 1), 200);
  const { total, parcels } = searchParcels({ q, ward, limit });
  return NextResponse.json({
    query: q,
    ward: ward || null,
    total,
    limit,
    wards: getData().wards,
    parcels: parcels.map(parcelToJson),
  });
}
