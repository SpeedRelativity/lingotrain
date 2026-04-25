import Groq from "groq-sdk";
import { incrementGroq } from "@/lib/usage";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const file = new File([audioBlob], "audio.webm", { type: audioBlob.type });

  const transcription = await client.audio.transcriptions.create({
    file,
    model: "whisper-large-v3",
    // No language hint — let Whisper auto-detect so English and mixed input transcribe correctly
  });

  incrementGroq();
  return transcription.text;
}
