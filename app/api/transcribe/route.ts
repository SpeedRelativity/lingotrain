import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/audio/stt";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get("audio");

  if (!audio || !(audio instanceof Blob)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  const text = await transcribeAudio(audio);
  return NextResponse.json({ text });
}
