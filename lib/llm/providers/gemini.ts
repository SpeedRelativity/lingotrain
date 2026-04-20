import { GoogleGenerativeAI } from "@google/generative-ai";
import { YUKI_SYSTEM_PROMPT, buildConversationMessages } from "../prompts/yuki-system";
import { TurnResponseSchema, type TurnResponse } from "../schema";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateTurnGemini(
  userText: string,
  history: Array<{ role: "user" | "yuki"; text: string }>
): Promise<TurnResponse> {
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash-preview-04-17",
    systemInstruction: YUKI_SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const conversationHistory = buildConversationMessages(history);

  const chat = model.startChat({
    history: conversationHistory,
  });

  const result = await chat.sendMessage(userText || "[SESSION_START]");
  const text = result.response.text();

  const parsed = JSON.parse(text);
  return TurnResponseSchema.parse(parsed);
}
