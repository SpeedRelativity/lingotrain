import { GoogleGenAI } from "@google/genai";
import { YUKI_SYSTEM_PROMPT, buildConversationMessages } from "../prompts/yuki-system";
import { TurnResponseSchema, type TurnResponse } from "../schema";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

export async function generateTurnGemini(
  userText: string,
  history: Array<{ role: "user" | "yuki"; text: string }>
): Promise<TurnResponse> {
  let builtHistory = buildConversationMessages(history);

  // Gemini requires history to start with a user turn
  if (builtHistory.length > 0 && builtHistory[0].role === "model") {
    builtHistory = [
      { role: "user", parts: [{ text: "[SESSION_START]" }] },
      ...builtHistory,
    ];
  }

  // Append the current user message as the final turn
  const contents = [
    ...builtHistory,
    { role: "user", parts: [{ text: userText || "[SESSION_START]" }] },
  ];

  const result = await getClient().models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: YUKI_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 0.7,
    },
    contents,
  });

  const text = result.text ?? "";
  const parsed = JSON.parse(text);
  return TurnResponseSchema.parse(parsed);
}
