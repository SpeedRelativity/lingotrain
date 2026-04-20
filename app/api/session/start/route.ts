import { NextResponse } from "next/server";
import { getUserByEmail, createSession } from "@/lib/db/queries";

const MVP_USER_EMAIL = process.env.MVP_USER_EMAIL ?? "necharkc@gmail.com";

export async function POST() {
  const user = await getUserByEmail(MVP_USER_EMAIL);
  const session = await createSession(user.id);
  return NextResponse.json({ sessionId: session.id, userId: user.id });
}
