import { NextRequest, NextResponse } from "next/server";
import { endSession, getSessionTrayItems } from "@/lib/db/queries";

export async function POST(req: NextRequest) {
  const { sessionId, topic, turnCount } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  await endSession(sessionId, topic ?? "conversation", turnCount ?? 0);
  const trayItems = await getSessionTrayItems(sessionId);

  return NextResponse.json({ ok: true, trayItems });
}
