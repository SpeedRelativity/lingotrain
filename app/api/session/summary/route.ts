import { NextRequest, NextResponse } from "next/server";
import { getSessionTrayItems } from "@/lib/db/queries";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }
  const trayItems = await getSessionTrayItems(sessionId);
  return NextResponse.json({ trayItems });
}
