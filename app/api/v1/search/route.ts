import {
  handleSemanticSearch,
  parseSearchQuery,
  searchBodySchema,
} from "@/features/search/api/search-handlers";

export async function GET(req: Request) {
  const parsed = parseSearchQuery(new URL(req.url).searchParams);
  if (!parsed.ok) {
    return Response.json({ error: "validation failed" }, { status: 400 });
  }
  const result = await handleSemanticSearch(parsed.data);
  if (!result.ok) {
    return Response.json(result.body, { status: result.status });
  }
  return Response.json(result.body);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = searchBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "validation failed" }, { status: 400 });
  }

  const result = await handleSemanticSearch(parsed.data);
  if (!result.ok) {
    return Response.json(result.body, { status: result.status });
  }
  return Response.json(result.body);
}
