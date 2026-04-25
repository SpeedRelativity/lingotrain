import Groq from "groq-sdk";
import { buildSystemPrompt } from "../prompts/yuki-system";
import { TurnResponseSchema, type TurnResponse, type Level } from "../schema";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateTurnGroq(
  userText: string,
  history: Array<{ role: "user" | "yuki"; text: string }>,
  level: Level
): Promise<TurnResponse> {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(level) },
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
