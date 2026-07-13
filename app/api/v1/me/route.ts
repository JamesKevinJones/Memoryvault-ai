import { getMe } from "@/features/auth/api/get-me";

export async function GET() {
  const me = await getMe();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(me);
}
