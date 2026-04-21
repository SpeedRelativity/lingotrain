import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const file = new File([audioBlob], "audio.webm", { type: audioBlob.type });

  const transcription = await client.audio.transcriptions.create({
    file,
    model: "whisper-large-v3",
    language: "ja",
  });

  return transcription.text;
}
