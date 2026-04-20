import { supabaseAdmin } from "./client";
import type { TurnResponse, TrayItem, Correction } from "../llm/schema";

export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", email)
    .single();
  if (error) throw error;
  return data;
}

export async function createSession(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .insert({ user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function endSession(sessionId: string, topic: string, turnCount: number) {
  const { error } = await supabaseAdmin
    .from("sessions")
    .update({ ended_at: new Date().toISOString(), topic, turn_count: turnCount })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function getSessionWithTurns(sessionId: string) {
  const { data: session, error: sErr } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  if (sErr) throw sErr;

  const { data: turns, error: tErr } = await supabaseAdmin
    .from("turns")
    .select("*")
    .eq("session_id", sessionId)
    .order("turn_index", { ascending: true });
  if (tErr) throw tErr;

  return { session, turns: turns ?? [] };
}

export async function saveTurn(
  sessionId: string,
  turnIndex: number,
  speaker: "user" | "yuki",
  textJa: string,
  textEn: string
) {
  const { data, error } = await supabaseAdmin
    .from("turns")
    .insert({ session_id: sessionId, turn_index: turnIndex, speaker, text_ja: textJa, text_en: textEn })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveCorrection(turnId: string, correction: Correction) {
  const { error } = await supabaseAdmin.from("corrections").insert({
    turn_id: turnId,
    raw: correction.user_said_raw,
    corrected: correction.corrected,
    severity: correction.severity,
    breakdown_json: correction.breakdown,
    explanation_en: correction.explanation_en,
  });
  if (error) throw error;
}

export async function saveTrayItems(
  userId: string,
  sessionId: string,
  turnId: string,
  items: TrayItem[]
) {
  if (items.length === 0) return;
  const rows = items.map((item) => ({
    user_id: userId,
    session_id: sessionId,
    turn_id: turnId,
    type: item.type,
    jp: item.jp,
    reading: item.reading ?? null,
    en: item.en,
    example_jp: item.example_sentence?.jp ?? null,
    example_en: item.example_sentence?.en ?? null,
    source: item.source,
  }));
  const { error } = await supabaseAdmin.from("tray_items").insert(rows);
  if (error) throw error;
}

export async function getSessionTrayItems(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("tray_items")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertUserVocab(userId: string, jp: string, usedCorrectly: boolean) {
  const { data: existing } = await supabaseAdmin
    .from("user_vocab")
    .select("*")
    .eq("user_id", userId)
    .eq("jp", jp)
    .single();

  if (existing) {
    await supabaseAdmin
      .from("user_vocab")
      .update({
        times_seen: existing.times_seen + 1,
        times_used_correctly: usedCorrectly
          ? existing.times_used_correctly + 1
          : existing.times_used_correctly,
      })
      .eq("user_id", userId)
      .eq("jp", jp);
  } else {
    await supabaseAdmin.from("user_vocab").insert({
      user_id: userId,
      jp,
      times_used_correctly: usedCorrectly ? 1 : 0,
    });
  }
}

export async function getConversationHistory(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("turns")
    .select("speaker, text_ja")
    .eq("session_id", sessionId)
    .order("turn_index", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((t) => ({
    role: t.speaker as "user" | "yuki",
    text: t.text_ja ?? "",
  }));
}
