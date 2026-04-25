import { NextResponse } from "next/server";
import { getUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getUsage());
}
