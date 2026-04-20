import { generateTurnGemini } from "./providers/gemini";
import { generateTurnGroq } from "./providers/groq";
import { TurnResponseSchema, type TurnResponse } from "./schema";

export type { TurnResponse };

export async function generateTurn(
  userText: string,
  history: Array<{ role: "user" | "yuki"; text: string }>
): Promise<TurnResponse> {
  try {
    return await generateTurnGemini(userText, history);
  } catch (primaryError) {
    console.error("[LLM] Gemini failed, falling back to Groq:", primaryError);
    try {
      return await generateTurnGroq(userText, history);
    } catch (fallbackError) {
      console.error("[LLM] Groq fallback also failed:", fallbackError);
      // Return a minimal safe response so the UI doesn't crash
      return TurnResponseSchema.parse({
        yuki: {
          ja: "すみません、もう一度言ってもらえますか？",
          ja_with_furigana: [{ text: "すみません、もう一度言ってもらえますか？" }],
          en: "Sorry, could you say that again?",
          romaji: "Sumimasen, mou ichido itte moraemasu ka?",
        },
        correction: null,
        tray_items: [],
        meta: {
          difficulty_adjusted: false,
          topic: "unknown",
          suggested_next_action: "clarify",
        },
      });
    }
  }
}
