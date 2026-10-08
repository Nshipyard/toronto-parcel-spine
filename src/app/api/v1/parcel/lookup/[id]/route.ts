import { NextResponse } from "next/server";
import { lookupParcel, parcelToJson } from "@/lib/parcel";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const p = lookupParcel(id);
  if (!p) return NextResponse.json({ error: `Unknown parcel id ${id}` }, { status: 404 });
  return NextResponse.json(parcelToJson(p));
}
