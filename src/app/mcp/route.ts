import { NextResponse } from "next/server";
import { getData, lookupParcel, searchParcels, parcelToJson } from "@/lib/parcel";

// Minimal MCP server over streamable HTTP (JSON-RPC 2.0 via POST).
// Supports: initialize, tools/list, tools/call. Stateless.

const SERVER = { name: "toronto-parcel-spine", version: "1.0.0" };

const TOOLS = [
  {
    name: "parcel_lookup",
    description:
      "Full record for one Toronto parcel: TOP-<PARCELID> id, feature type, approximate area, ward, neighbourhood, addresses, source rows merged, lineage, and the stacked multi-address flag.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Parcel id, e.g. 'TOP-1234567' (case-insensitive)" } },
      required: ["id"],
    },
  },
  {
    name: "parcel_search",
    description:
      "Search the 25,684-row parcel sample (1,000 per ward plus 684 unplaced) by address text or parcel id, optionally filtered to one ward.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Address fragment or parcel id, e.g. 'Queen St W' or 'TOP-1234567'" },
        ward: { type: "string", description: "Ward code, e.g. '10'. Optional." },
        limit: { type: "integer", description: "Max results, default 50, max 200." },
      },
      required: [],
    },
  },
  {
    name: "parcel_summary",
    description:
      "Totals, breakdowns, and methodology notes for the full Toronto parcel spine build (parcel counts, address match rate, stacked parcels, size buckets, top wards).",
    inputSchema: { type: "object", properties: {} },
  },
];

function ok(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function err(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
function textResult(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function handle(msg: any) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return err(msg?.id ?? null, -32600, "Invalid Request");
  }
  const id = msg.id ?? null;
  switch (msg.method) {
    case "initialize":
      return ok(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER,
      });
    case "notifications/initialized":
      return null;
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const { name, arguments: args } = msg.params ?? {};
      try {
        if (name === "parcel_lookup") {
          const p = lookupParcel(String(args?.id ?? ""));
          if (!p) return err(id, -32001, `Unknown parcel id ${args?.id}`);
          return ok(id, textResult(parcelToJson(p)));
        }
        if (name === "parcel_search") {
          const rawLimit = parseInt(String(args?.limit ?? "50"), 10);
          const limit = Math.min(Math.max(isNaN(rawLimit) ? 50 : rawLimit, 1), 200);
          const r = searchParcels({ q: String(args?.q ?? ""), ward: String(args?.ward ?? ""), limit });
          return ok(id, textResult({ total: r.total, parcels: r.parcels.map(parcelToJson) }));
        }
        if (name === "parcel_summary") {
          return ok(id, textResult(getData().summary));
        }
        return err(id, -32602, `Unknown tool ${name}`);
      } catch (e) {
        return err(id, -32000, `Tool error: ${(e as Error).message}`);
      }
    }
    default:
      return err(id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error"), { status: 400 });
  }
  if (Array.isArray(body)) {
    const out = body.map(handle).filter((r) => r !== null);
    return NextResponse.json(out);
  }
  const out = handle(body);
  if (out === null) return new NextResponse(null, { status: 202 });
  return NextResponse.json(out);
}

export async function GET() {
  return NextResponse.json(
    { error: "This MCP server accepts JSON-RPC 2.0 via POST only." },
    { status: 405 }
  );
}

export async function DELETE() {
  return new NextResponse(null, { status: 405 });
}
