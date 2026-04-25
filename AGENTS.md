<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Project: Yuki — Japanese Conversation Learning App

A single-user MVP web app where a user converses with Yuki, an AI Japanese tutor. The app handles speech input, LLM-generated Japanese responses with glossing and corrections, TTS playback, and vocabulary collection.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16.2.4 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 (PostCSS v4) |
| State | Zustand 5 (client-only, in-memory) |
| UI components | shadcn + Base UI 1.4 + Vaul (drawer) |
| Primary LLM | Gemini 2.5 Flash (`gemini-2.5-flash`) via Google GenAI SDK |
| Fallback LLM | LLaMA 3.3 70B via Groq SDK |
| STT | Groq Whisper Large V3 (no language hint — handles mixed input) |
| TTS | ElevenLabs Multilingual V2, streamed |
| Database | Supabase (PostgreSQL) |
| Validation | Zod 4 |

---

## Directory Map

```
app/
  page.tsx                      Home — "Start conversation" button
  session/[id]/page.tsx         Main conversation interface
  session/[id]/summary/page.tsx Post-session vocab summary
  api/
    session/start/route.ts      Create session + return sessionId/userId
    session/end/route.ts        Mark session ended, return tray items
    session/summary/route.ts    Fetch session vocab items
    turn/route.ts               Main loop: LLM call + DB save
    transcribe/route.ts         Groq Whisper STT
    speak/route.ts              ElevenLabs TTS (streaming)
    usage/route.ts              In-memory API usage counters

components/conversation/
  YukiBubble.tsx                Yuki's Japanese response + glossed tokens
  UserBubble.tsx                Right-aligned user message
  CorrectionCard.tsx            Red/blue card for grammar mistakes
  BetterWayCard.tsx             Green card for naturalness upgrades
  GlossedText.tsx               Clickable furigana tokens
  MicButton.tsx                 Hold-to-record or click-to-toggle mic
  LevelBar.tsx                  5-button difficulty switcher
  TrayDrawer.tsx                Bottom panel of collected vocab
  UsageBar.tsx                  Collapsible API usage display
  ContinueButton.tsx            Resume button after TTS finishes

stores/
  conversationStore.ts          sessionId, userId, turns[], mode, level, latestResponse
  trayStore.ts                  TrayItem[] collected during session

lib/
  llm/
    schema.ts                   Zod schemas: TurnResponse, TrayItem, GlossToken, Level
    provider.ts                 generateTurn() — Gemini primary, Groq fallback
    providers/gemini.ts         generateTurnGemini()
    providers/groq.ts           generateTurnGroq()
    prompts/yuki-system.ts      buildSystemPrompt(level) — ~227 lines, per-level specs
  db/
    client.ts                   Supabase client (public) + supabaseAdmin (service role)
    queries.ts                  All DB query functions (12 functions)
    schema.sql                  Full PostgreSQL schema
  audio/
    stt.ts                      transcribeAudio() — Groq Whisper
    tts.ts                      synthesizeSpeech() — ElevenLabs streaming
  usage.ts                      In-memory counters (reset on server restart)
  utils.ts                      cn() for Tailwind class merging
```

---

## Core Data Flow

1. Home → `POST /api/session/start` → DB creates session row → returns `{sessionId, userId}`
2. Client stores `userId` in `sessionStorage` as `yuki_user_id`; navigates to `/session/{id}`
3. User speaks → `MediaRecorder` (webm) → `POST /api/transcribe` → Groq Whisper → text
4. Text → `POST /api/turn` with `{sessionId, userId, userText, turnIndex, level}` → `generateTurn()` → validated `TurnResponse` → saved to DB → returned to client
5. Client renders `YukiBubble` (glossed tokens), `CorrectionCard` or `BetterWayCard`
6. `POST /api/speak` with Yuki's `ja` text → ElevenLabs stream → Audio element plays
7. End session → `POST /api/session/end` → tray items saved to DB → redirect to `/summary`

---

## Key Types (`lib/llm/schema.ts`)

```ts
TurnResponse {
  yuki: { ja, tokens: GlossToken[], en, romaji? }
  correction_type: "mistake" | "upgrade" | "none"
  correction: { user_said_raw, interpretation, corrected, severity, breakdown[], explanation_en } | null
  better_way: { user_attempt_normalized, improved_sentence, improved_tokens[], why, breakdown[] } | null
  tray_items: TrayItem[]
  meta: { difficulty_adjusted, topic, suggested_next_action, proactive_teach }
}

GlossToken { surface, reading?, meaning?, is_new?, known? }

TrayItem {
  type: "vocab" | "grammar" | "particle" | "expression"
  jp, reading?, en, example_sentence?, source, turn_index?
}

Level = "beginner" | "easy" | "intermediate" | "advanced" | "expert"
```

Rule: exactly ONE `correction_type` per turn — never populate both `correction` and `better_way`.

---

## Database Schema (Supabase/PostgreSQL)

Tables: `users`, `sessions`, `turns`, `corrections`, `tray_items`, `user_vocab`

- `users`: id UUID, email (unique), level, created_at
- `sessions`: id, user_id FK, started_at, ended_at, topic, turn_count
- `turns`: id, session_id FK, turn_index, speaker (user|yuki), text_ja, text_en, audio_url
- `corrections`: id, turn_id FK, raw, corrected, severity (minor|major), breakdown_json JSONB, explanation_en
- `tray_items`: id, user_id FK, session_id FK, turn_id FK, type, jp, reading, en, example_jp, example_en, source
- `user_vocab`: (user_id, jp) compound PK, first_seen_at, times_seen, times_used_correctly

Schema lives in `lib/db/schema.sql`. Run it in Supabase SQL editor to set up.

---

## Auth (MVP)

No login. Hard-coded single user by email (`MVP_USER_EMAIL` env var, defaults to `necharkc@gmail.com`). Session start fetches this user from DB. User ID stored in `sessionStorage`. Missing `yuki_user_id` → redirects to home.

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=          # optional, defaults to Rachel voice
MVP_USER_EMAIL=necharkc@gmail.com
```

---

## Non-Obvious Conventions

**LLM history format:** Conversation history passed to LLM uses `text_ja` only (no English). First turn always prefixed with a `[SESSION_START]` user message. Inactivity after 20 s auto-sends `[IDLE_NUDGE]`.

**Token glossing by level:**
- Beginner/Easy: romaji + particle pronunciation (は→wa, not "ha"); all tokens broken down
- Intermediate: sparse, skip known basics
- Advanced/Expert: one nuance item max; Japanese-only explanations

**Zustand stores are in-memory only.** State resets on page reload. `sessionStorage` used for `userId` persistence across reloads within the same browser tab.

**Usage counters** (`lib/usage.ts`) reset on every server restart — they are in-memory, not DB-backed.

**Audio pipeline:** `MediaRecorder` → webm blob → FormData → Groq Whisper → text. TTS response is a streamed `audio/mpeg` blob → `URL.createObjectURL()` → `<audio>` element.

**Naming:** files kebab-case, components PascalCase, store actions camelCase, API routes kebab-case paths.

**Tailwind v4:** Uses PostCSS plugin (`@tailwindcss/postcss`). Config is in `postcss.config.mjs`, not `tailwind.config.js`. CSS variables and `@layer` work differently — check `node_modules/next/dist/docs/` before assuming v3 behavior.

**shadcn components** live in `components/ui/`. Do not regenerate them without checking existing customizations.

---

## Running Locally

```bash
npm install
cp .env.local.example .env.local   # fill in keys
# Paste lib/db/schema.sql into Supabase SQL editor
npm run dev                         # http://localhost:3000
```

Test the LLM prompt without the UI:
```bash
npx tsx --import ./scripts/load-env.ts scripts/test-prompt.ts
```
