import { generateTurnGemini } from "./providers/gemini";
import { generateTurnGroq } from "./providers/groq";
import { TurnResponseSchema, type TurnResponse, type Level } from "./schema";
import { incrementGemini, incrementTurns } from "@/lib/usage";

export type { TurnResponse };

export async function generateTurn(
  userText: string,
  history: Array<{ role: "user" | "yuki"; text: string }>,
  level: Level = "beginner"
): Promise<TurnResponse> {
  incrementTurns();
  try {
    const result = await generateTurnGemini(userText, history, level);
    incrementGemini();
    return result;
  } catch (primaryError) {
    console.error("[LLM] Gemini failed, falling back to Groq:", primaryError);
    try {
      return await generateTurnGroq(userText, history, level);
    } catch (fallbackError) {
      console.error("[LLM] Groq fallback also failed:", fallbackError);
      return TurnResponseSchema.parse({
        yuki: {
          ja: "すみません、もう一度言ってもらえますか？",
          tokens: [{ surface: "すみません、もう一度言ってもらえますか？", known: true }],
          en: "Sorry, could you say that again?",
          romaji: "Sumimasen, mou ichido itte moraemasu ka?",
        },
        correction_type: "none",
        correction: null,
        better_way: null,
        tray_items: [],
        meta: {
          difficulty_adjusted: false,
          topic: "unknown",
          suggested_next_action: "clarify",
          proactive_teach: false,
        },
      });
    }
  }
}
