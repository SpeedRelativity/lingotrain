import { NextRequest, NextResponse } from "next/server";
import { generateTurn } from "@/lib/llm/provider";
import { LEVELS, type Level } from "@/lib/llm/schema";
import {
  getConversationHistory,
  saveTurn,
  saveCorrection,
  saveTrayItems,
} from "@/lib/db/queries";

export async function POST(req: NextRequest) {
  const { sessionId, userId, userText, turnIndex, level } = await req.json();

  if (!sessionId || !userId) {
    return NextResponse.json({ error: "Missing sessionId or userId" }, { status: 400 });
  }

  const safeLevel: Level = LEVELS.includes(level) ? level : "beginner";

  const history = await getConversationHistory(sessionId);

  let userTurnId: string | null = null;
  if (userText) {
    const userTurn = await saveTurn(sessionId, turnIndex, "user", userText, "");
    userTurnId = userTurn.id;
    history.push({ role: "user", text: userText });
  }

  const response = await generateTurn(userText ?? "", history, safeLevel);

  const yukiTurn = await saveTurn(
    sessionId,
    turnIndex + (userText ? 1 : 0),
    "yuki",
    response.yuki.ja,
    response.yuki.en
  );

  if (response.correction && userTurnId) {
    await saveCorrection(userTurnId, response.correction);
  }

  if (response.tray_items.length > 0) {
    await saveTrayItems(userId, sessionId, yukiTurn.id, response.tray_items);
  }

  return NextResponse.json(response);
}
