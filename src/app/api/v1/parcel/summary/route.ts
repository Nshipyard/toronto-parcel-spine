import { NextResponse } from "next/server";
import { getData } from "@/lib/parcel";

export async function GET() {
  return NextResponse.json(getData().summary);
}
