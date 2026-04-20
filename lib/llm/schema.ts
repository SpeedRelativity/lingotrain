import { z } from "zod";

export const FuriganaTokenSchema = z.object({
  text: z.string(),
  reading: z.string().optional(),
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
  example_sentence: z
    .object({ jp: z.string(), en: z.string() })
    .optional(),
  source: z.enum(["yuki_introduced", "user_error", "user_unknown"]),
});

export const TurnResponseSchema = z.object({
  yuki: z.object({
    ja: z.string(),
    ja_with_furigana: z.array(FuriganaTokenSchema),
    en: z.string(),
    romaji: z.string().optional(),
  }),
  correction: CorrectionSchema.nullable(),
  tray_items: z.array(TrayItemSchema),
  meta: z.object({
    difficulty_adjusted: z.boolean(),
    topic: z.string(),
    suggested_next_action: z.enum(["continue", "wrap_up", "clarify"]),
  }),
});

export type TurnResponse = z.infer<typeof TurnResponseSchema>;
export type TrayItem = z.infer<typeof TrayItemSchema>;
export type Correction = z.infer<typeof CorrectionSchema>;
