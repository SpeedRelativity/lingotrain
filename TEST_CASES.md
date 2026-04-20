# Yuki LLM Test Cases

Run these with `npx tsx scripts/test-prompt.ts` to validate the system prompt.
All cases must produce valid JSON matching the TurnResponse schema with the described behavior.

---

## Section 1: LLM behavior test cases

### Case 1.1 — Session opener (no user input)
**Input:** `[SESSION_START]`
**History:** empty
**Expected:**
- `correction` is `null`
- `yuki.ja` contains a greeting
- `meta.topic` is `"introductions"` or similar
- `tray_items` is empty (nothing to teach yet)
- `meta.suggested_next_action` is `"continue"`

---

### Case 1.2 — Correct user input, no errors
**Input:** `わたしはねちゃです。にほんごをべんきょうしています。`
**History:** [Yuki opened with a greeting and asked for the user's name]
**Expected:**
- `correction` is `null`
- `yuki.ja` is a natural response (e.g., commenting on studying Japanese)
- `meta.topic` is `"introductions"` or `"studying"`

---

### Case 1.3 — Major particle error
**Input:** `わたしはがっこうをいきます。`
**History:** [Yuki asked what the user does on weekdays]
**Expected:**
- `correction` is NOT null
- `correction.severity` is `"major"`
- `correction.corrected` contains `がっこうに` (correct particle is に for direction/destination)
- `correction.breakdown` has an entry explaining the に vs を distinction
- `yuki.ja` still continues the conversation naturally

---

### Case 1.4 — Minor naturalness error
**Input:** `わたしはとてもおなかがすいています。たべたいです。`
**History:** [Yuki asked how the user is feeling today]
**Expected:**
- `correction` may be null OR severity is `"minor"`
- If correction: it addresses naturalness (e.g., the phrase is technically fine but something could be improved)
- `yuki.ja` engages naturally with the content (hunger/wanting to eat)

---

### Case 1.5 — English mixed in
**Input:** `わたしはsushiがすきです。でも fishは...たべません。`
**History:** [Yuki asked about the user's favorite foods]
**Expected:**
- `correction` is NOT null
- `correction.corrected` replaces "sushi" with `すし` and "fish" with `さかな`
- `tray_items` includes `さかな` (fish) with source `"user_unknown"`
- `yuki.ja` continues the food conversation

---

### Case 1.6 — Completely wrong sentence structure
**Input:** `きのう わたし たべた ラーメン おいしい。`
**History:** [Yuki asked what the user did yesterday]
**Expected:**
- `correction` is NOT null, severity `"major"`
- `correction.corrected` reconstructs to correct word order: `きのう、わたしはラーメンをたべました。おいしかったです。`
- `correction.breakdown` explains at minimum: the を particle, ました past tense form
- `tray_items` includes past tense grammar if not already introduced this session

---

### Case 1.7 — User says something in pure English
**Input:** `I don't know how to say this in Japanese.`
**History:** [Yuki asked about the user's weekend plans]
**Expected:**
- `correction` is null (no Japanese to correct)
- `yuki.ja` gently encourages the user to try in Japanese
- `yuki.ja` may offer a scaffold like "You could say: ..."
- `meta.suggested_next_action` is `"clarify"` or `"continue"`

---

### Case 1.8 — Ambiguous utterance
**Input:** `いきたいです。`
**History:** [Yuki asked "what would you like to do this weekend?"]
**Expected:**
- `yuki.ja` acknowledges the ambiguity and asks for clarification (where do you want to go?)
- `correction` is null
- `meta.suggested_next_action` is `"clarify"`

---

### Case 1.9 — User makes same error as a previous correction
**Input:** `がっこうをいきます。`
**History:** [Turn 1: Yuki opened. Turn 2: User said がっこうをいきます. Turn 3: Yuki corrected it. Turn 4: Yuki asked another question. Turn 5: User repeats the same error]
**Expected:**
- `correction` is NOT null
- The correction reiterates the に vs を lesson
- `yuki.ja` is still warm and patient, not scolding

---

### Case 1.10 — New vocabulary above N4 used by Yuki
**Input:** `[SESSION_START]` (Yuki introduces herself in a way that uses N3+ vocab)
**History:** empty
**Expected:**
- If `yuki.ja` contains any word above N4, it MUST appear in `tray_items` with `source: "yuki_introduced"`
- Yuki should generally stick to N5-N4 vocabulary

---

### Case 1.11 — Session wrap-up signal
**Input:** `そろそろかえります。またね！`
**History:** [5+ turns have occurred, the conversation has been going a while]
**Expected:**
- `meta.suggested_next_action` is `"wrap_up"`
- `yuki.ja` gives a warm farewell
- `tray_items` may be empty (it's a closing)

---

### Case 1.12 — Schema compliance stress test
**Input:** `すみません、もういちどいってください。`
**History:** [Any history]
**Expected:**
- JSON is valid and parses without error
- All required fields are present: `yuki.ja`, `yuki.ja_with_furigana`, `yuki.en`, `correction`, `tray_items`, `meta.difficulty_adjusted`, `meta.topic`, `meta.suggested_next_action`
- `correction` is exactly `null` or a valid correction object (not an empty object `{}`)
- `tray_items` is an array (may be empty)

---

## Section 2: Edge cases to watch

- LLM returns markdown-wrapped JSON (`\`\`\`json ... \`\`\``) — the harness should detect and flag this
- LLM returns `correction: {}` instead of `correction: null` — Zod should catch this
- LLM uses kanji without adding furigana tokens — acceptable for common N5 kanji, flag for others
- LLM introduces 3+ new vocab in a single tray_items response — flag as over-introduction
- `yuki.ja` and `yuki.en` are obviously mismatched translations — flag for manual review
