import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const file = new File([audioBlob], "audio.webm", { type: audioBlob.type });

  const transcription = await client.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "ja",
  });

  return transcription.text;
}
