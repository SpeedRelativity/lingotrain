import { NextRequest, NextResponse } from "next/server";
import { generateTurn } from "@/lib/llm/provider";
import {
  getConversationHistory,
  saveTurn,
  saveCorrection,
  saveTrayItems,
} from "@/lib/db/queries";

export async function POST(req: NextRequest) {
  const { sessionId, userId, userText, turnIndex } = await req.json();

  if (!sessionId || !userId) {
    return NextResponse.json({ error: "Missing sessionId or userId" }, { status: 400 });
  }

  // Save the user's turn first
  let userTurnId: string | null = null;
  if (userText) {
    const userTurn = await saveTurn(
      sessionId,
      turnIndex,
      "user",
      userText,
      "" // no EN for user turns
    );
    userTurnId = userTurn.id;
  }

  // Fetch full history for LLM context
  const history = await getConversationHistory(sessionId);

  // Generate Yuki's response
  const response = await generateTurn(userText ?? "", history);

  // Save Yuki's turn
  const yukiTurn = await saveTurn(
    sessionId,
    turnIndex + 1,
    "yuki",
    response.yuki.ja,
    response.yuki.en
  );

  // Persist correction if present
  if (response.correction && userTurnId) {
    await saveCorrection(userTurnId, response.correction);
  }

  // Persist tray items
  if (response.tray_items.length > 0) {
    await saveTrayItems(userId, sessionId, yukiTurn.id, response.tray_items);
  }

  return NextResponse.json(response);
}
