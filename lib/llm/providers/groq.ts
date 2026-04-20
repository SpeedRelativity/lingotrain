import Groq from "groq-sdk";
import { YUKI_SYSTEM_PROMPT } from "../prompts/yuki-system";
import { TurnResponseSchema, type TurnResponse } from "../schema";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateTurnGroq(
  userText: string,
  history: Array<{ role: "user" | "yuki"; text: string }>
): Promise<TurnResponse> {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: YUKI_SYSTEM_PROMPT },
    ...history.map((turn) => ({
      role: (turn.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: turn.text,
    })),
    { role: "user", content: userText || "[SESSION_START]" },
  ];

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const text = completion.choices[0].message.content ?? "";
  const parsed = JSON.parse(text);
  return TurnResponseSchema.parse(parsed);
}
