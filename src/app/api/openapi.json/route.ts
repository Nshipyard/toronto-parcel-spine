import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Toronto Parcel Spine API",
    version: "1.0.0",
    description:
      "One stable ID (TOP-<PARCELID>) per Toronto property, joining the City of Toronto's Property Boundaries with address points from the Toronto One Address Repository. Built from the 25,684-row stratified sample (1,000 parcels per ward plus 684 unplaced); summary statistics describe the full build. MIT licensed.",
  },
  servers: [{ url: "https://canada.nshipyard.com/api/v1" }],
  paths: {
    "/parcel/search": {
      get: {
        summary: "Search parcels by address text or parcel ID, optionally filtered by ward",
        parameters: [
          { name: "q", in: "query", required: false, schema: { type: "string" }, example: "Queen St W" },
          { name: "ward", in: "query", required: false, schema: { type: "string" }, example: "10" },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50, maximum: 200 } },
        ],
        responses: { "200": { description: "Matching parcels, capped at limit" } },
      },
    },
    "/parcel/lookup/{id}": {
      get: {
        summary: "Full record for one parcel, by TOP-<PARCELID> (case-insensitive)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, example: "TOP-1234567" }],
        responses: {
          "200": { description: "Parcel record with lineage, addresses, and stacked flag" },
          "404": { description: "Unknown parcel id" },
        },
      },
    },
    "/parcel/summary": {
      get: {
        summary: "Totals, breakdowns, and methodology notes for the full parcel spine build",
        responses: { "200": { description: "Summary of the full build, not the sample" } },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
