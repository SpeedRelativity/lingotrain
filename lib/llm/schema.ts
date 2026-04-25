import { z } from "zod";

export const LEVELS = ["beginner", "easy", "intermediate", "advanced", "expert"] as const;
export type Level = typeof LEVELS[number];

export const GlossTokenSchema = z.object({
  surface: z.string(),
  reading: z.string().optional(),   // hiragana reading for kanji
  meaning: z.string().optional(),   // short English gloss
  is_new: z.boolean().optional(),
  known: z.boolean().optional(),    // particle/punctuation/definitely known
});

export const CorrectionBreakdownSchema = z.object({
  token: z.string(),
  reading: z.string().optional(),
  role: z.string(),
  note: z.string(),
});

export const CorrectionSchema = z.object({
  user_said_raw: z.string(),
  interpretation: z.string(),
  corrected: z.string(),
  severity: z.enum(["minor", "major"]),
  breakdown: z.array(CorrectionBreakdownSchema),
  explanation_en: z.string(),
});

export const TrayItemSchema = z.object({
  type: z.enum(["vocab", "grammar", "particle", "expression"]),
  jp: z.string(),
  reading: z.string().optional(),
  en: z.string(),
  example_sentence: z.object({ jp: z.string(), en: z.string() }).optional(),
  source: z.enum(["yuki_introduced", "user_error", "user_unknown"]),
  turn_index: z.number().optional(),
});

export const BetterWayTokenSchema = z.object({
  token: z.string(),
  reading: z.string().optional(),   // furigana (kana reading of kanji)
  romaji: z.string().optional(),    // romaji for display in breakdown
  meaning: z.string().optional(),
  is_above_level: z.boolean().optional(),
});

export const BetterWaySchema = z.object({
  user_attempt_normalized: z.string(),
  improved_sentence: z.string(),
  improved_tokens: z.array(BetterWayTokenSchema),
  why: z.string(),
  breakdown: z.array(BetterWayTokenSchema),
});

// correction_type decides which card renders — exactly one per turn
export const CorrectionTypeSchema = z.enum(["mistake", "upgrade", "none"]);

export const TurnResponseSchema = z.object({
  yuki: z.object({
    ja: z.string(),
    tokens: z.array(GlossTokenSchema),
    en: z.string(),
    romaji: z.string().optional(),
  }),
  correction_type: CorrectionTypeSchema,  // "mistake" | "upgrade" | "none"
  correction: CorrectionSchema.nullable(),
  better_way: BetterWaySchema.nullable(),
  tray_items: z.array(TrayItemSchema),
  meta: z.object({
    difficulty_adjusted: z.boolean(),
    topic: z.string(),
    suggested_next_action: z.enum(["continue", "wrap_up", "clarify"]),
    proactive_teach: z.boolean(),
  }),
});

export type TurnResponse = z.infer<typeof TurnResponseSchema>;
export type TrayItem = z.infer<typeof TrayItemSchema>;
export type Correction = z.infer<typeof CorrectionSchema>;
export type GlossToken = z.infer<typeof GlossTokenSchema>;
export type BetterWay = z.infer<typeof BetterWaySchema>;
export type BetterWayToken = z.infer<typeof BetterWayTokenSchema>;
export type CorrectionType = z.infer<typeof CorrectionTypeSchema>;
