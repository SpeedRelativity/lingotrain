import { NextRequest } from "next/server";
import { synthesizeSpeech } from "@/lib/audio/tts";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 });
  }

  const stream = await synthesizeSpeech(text);

  return new Response(stream, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Transfer-Encoding": "chunked",
    },
  });
}
