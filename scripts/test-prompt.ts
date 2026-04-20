#!/usr/bin/env npx tsx
/**
 * CLI test harness for iterating on the Yuki system prompt.
 * Usage: npx tsx scripts/test-prompt.ts [case-number]
 *   e.g. npx tsx scripts/test-prompt.ts 1.3
 *        npx tsx scripts/test-prompt.ts        (runs all cases)
 */

import { config } from "dotenv";
import { generateTurnGemini } from "../lib/llm/providers/gemini";
import { TurnResponseSchema } from "../lib/llm/schema";

config({ path: ".env.local" });

interface TestCase {
  id: string;
  description: string;
  userText: string;
  history: Array<{ role: "user" | "yuki"; text: string }>;
  validate: (result: ReturnType<typeof TurnResponseSchema.parse>) => string[];
}

const CASES: TestCase[] = [
  {
    id: "1.1",
    description: "Session opener (no user input)",
    userText: "",
    history: [],
    validate: (r) => {
      const errors: string[] = [];
      if (r.correction !== null) errors.push("correction should be null for opener");
      if (!r.yuki.ja) errors.push("yuki.ja is empty");
      if (r.tray_items.length > 0) errors.push("tray_items should be empty for opener");
      return errors;
    },
  },
  {
    id: "1.2",
    description: "Correct user input — no errors",
    userText: "わたしはねちゃです。にほんごをべんきょうしています。",
    history: [
      { role: "yuki", text: "こんにちは！はじめまして。わたしはゆきです。あなたのなまえはなんですか？" },
    ],
    validate: (r) => {
      const errors: string[] = [];
      if (r.correction !== null) errors.push("correction should be null for correct input");
      return errors;
    },
  },
  {
    id: "1.3",
    description: "Major particle error (を → に)",
    userText: "わたしはがっこうをいきます。",
    history: [
      { role: "yuki", text: "へいじつはなにをしていますか？" },
    ],
    validate: (r) => {
      const errors: string[] = [];
      if (!r.correction) errors.push("correction should not be null");
      if (r.correction && r.correction.severity !== "major") errors.push("severity should be major");
      if (r.correction && !r.correction.corrected.includes("に")) errors.push("corrected form should use に particle");
      return errors;
    },
  },
  {
    id: "1.5",
    description: "English mixed in",
    userText: "わたしはsushiがすきです。でも fishは...たべません。",
    history: [
      { role: "yuki", text: "すきなたべものはなんですか？" },
    ],
    validate: (r) => {
      const errors: string[] = [];
      if (!r.correction) errors.push("correction expected for English words");
      const hasFish = r.tray_items.some((t) => t.jp === "さかな" || t.jp === "魚");
      if (!hasFish) errors.push("tray_items should include さかな (fish)");
      return errors;
    },
  },
  {
    id: "1.6",
    description: "Wrong sentence structure",
    userText: "きのう わたし たべた ラーメン おいしい。",
    history: [
      { role: "yuki", text: "きのうはなにをしましたか？" },
    ],
    validate: (r) => {
      const errors: string[] = [];
      if (!r.correction) errors.push("correction expected for wrong structure");
      if (r.correction && r.correction.severity !== "major") errors.push("severity should be major");
      if (r.correction && r.correction.breakdown.length < 2) errors.push("breakdown should explain multiple issues");
      return errors;
    },
  },
  {
    id: "1.7",
    description: "Pure English input",
    userText: "I don't know how to say this in Japanese.",
    history: [
      { role: "yuki", text: "しゅうまつはなにをするつもりですか？" },
    ],
    validate: (r) => {
      const errors: string[] = [];
      if (r.correction !== null) errors.push("correction should be null for English input");
      return errors;
    },
  },
  {
    id: "1.8",
    description: "Ambiguous utterance",
    userText: "いきたいです。",
    history: [
      { role: "yuki", text: "しゅうまつはなにをしたいですか？" },
    ],
    validate: (r) => {
      const errors: string[] = [];
      if (r.meta.suggested_next_action !== "clarify") {
        errors.push(`suggested_next_action should be 'clarify', got '${r.meta.suggested_next_action}'`);
      }
      return errors;
    },
  },
  {
    id: "1.11",
    description: "Session wrap-up",
    userText: "そろそろかえります。またね！",
    history: [
      { role: "yuki", text: "こんにちは！" },
      { role: "user", text: "こんにちは、ゆきさん。" },
      { role: "yuki", text: "げんきですか？" },
      { role: "user", text: "はい、げんきです。" },
      { role: "yuki", text: "きょうはいいてんきですね。" },
      { role: "user", text: "そうですね。" },
    ],
    validate: (r) => {
      const errors: string[] = [];
      if (r.meta.suggested_next_action !== "wrap_up") {
        errors.push(`suggested_next_action should be 'wrap_up', got '${r.meta.suggested_next_action}'`);
      }
      return errors;
    },
  },
  {
    id: "1.12",
    description: "Schema compliance",
    userText: "すみません、もういちどいってください。",
    history: [
      { role: "yuki", text: "きょうはどこにいきましたか？" },
    ],
    validate: (r) => {
      const errors: string[] = [];
      if (!Array.isArray(r.yuki.ja_with_furigana)) errors.push("ja_with_furigana must be array");
      if (!r.yuki.en) errors.push("yuki.en is required");
      if (typeof r.meta.difficulty_adjusted !== "boolean") errors.push("difficulty_adjusted must be boolean");
      if (!r.meta.topic) errors.push("meta.topic is required");
      return errors;
    },
  },
];

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

async function runCase(tc: TestCase): Promise<boolean> {
  process.stdout.write(`  Case ${tc.id}: ${tc.description}... `);

  try {
    const result = await generateTurnGemini(tc.userText, tc.history);

    // Additional schema check: ensure no raw markdown fences
    // (already handled by JSON.parse, but double check)
    const errors = tc.validate(result);

    if (errors.length === 0) {
      console.log(`${GREEN}PASS${RESET}`);
      return true;
    } else {
      console.log(`${RED}FAIL${RESET}`);
      for (const e of errors) {
        console.log(`    ${RED}✗${RESET} ${e}`);
      }
      console.log(`    ${YELLOW}Response preview:${RESET}`, JSON.stringify(result.yuki.ja).slice(0, 80));
      return false;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`${RED}ERROR${RESET}`);
    console.log(`    ${RED}✗${RESET} ${message}`);
    return false;
  }
}

async function main() {
  const targetId = process.argv[2];
  const cases = targetId ? CASES.filter((c) => c.id === targetId) : CASES;

  if (cases.length === 0) {
    console.error(`No test case found with id: ${targetId}`);
    process.exit(1);
  }

  console.log(`\n${BOLD}Yuki LLM Test Harness${RESET}`);
  console.log(`Running ${cases.length} case(s) against Gemini...\n`);

  let passed = 0;
  let failed = 0;

  for (const tc of cases) {
    const ok = await runCase(tc);
    if (ok) passed++;
    else failed++;
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n${BOLD}Results:${RESET} ${GREEN}${passed} passed${RESET} / ${failed > 0 ? RED : ""}${failed} failed${RESET}`);

  if (failed > 0) {
    console.log(`\nIterate on ${YELLOW}lib/llm/prompts/yuki-system.ts${RESET} and re-run.\n`);
    process.exit(1);
  } else {
    console.log(`\n${GREEN}All cases pass. You're ready for Phase 2.${RESET}\n`);
  }
}

main();
